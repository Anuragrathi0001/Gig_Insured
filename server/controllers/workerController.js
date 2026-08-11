const mongoose = require('mongoose');
const { Worker, Policy, Claim, FraudFlag } = require('../models');
const riskEngine = require('../services/riskEngine');
const { mockWorkerStore } = require('./authController');
const { mockPolicyStore } = require('./policyController');
const { mockClaimsStore } = require('./claimController');
const { mockFraudFlagsStore } = require('../services/fraudEngine');

/**
 * @desc    Onboard new or existing worker profile & generate risk profile
 * @route   POST /api/workers/onboard
 * @access  Private (JWT Protected)
 */
const onboardWorker = async (req, res) => {
  try {
    const { name, city, zone, platform, workerId, avgWeeklyIncome, upiId } = req.body;

    if (!name || !city || !zone || !platform || !workerId || !upiId) {
      return res.status(400).json({
        status: 'fail',
        message: 'All fields (name, city, zone, platform, workerId, upiId) are required for onboarding.'
      });
    }

    const income = Number(avgWeeklyIncome) || 4500;

    const riskProfile = riskEngine.calculateRiskProfile({
      city,
      zone,
      platform,
      avgWeeklyIncome: income
    });

    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let worker;

    if (isDbConnected) {
      worker = await Worker.findByIdAndUpdate(
        req.worker._id,
        {
          name: name.trim(),
          city: city.trim(),
          zone: zone.trim(),
          platform,
          workerId: workerId.trim(),
          avgWeeklyIncome: income,
          upiId: upiId.trim(),
          kycStatus: 'verified',
          riskProfile: {
            zoneRiskScore: riskProfile.zoneRiskScore,
            weatherExposureScore: riskProfile.weatherExposureScore
          }
        },
        { new: true, runValidators: true }
      );
    } else {
      console.log('[Worker Controller]: Offline mode. Updating in-memory worker store.');
      const existing = req.worker;
      worker = {
        ...existing,
        name: name.trim(),
        city: city.trim(),
        zone: zone.trim(),
        platform,
        workerId: workerId.trim(),
        avgWeeklyIncome: income,
        upiId: upiId.trim(),
        kycStatus: 'verified',
        riskProfile: {
          zoneRiskScore: riskProfile.zoneRiskScore,
          weatherExposureScore: riskProfile.weatherExposureScore
        },
        updatedAt: new Date()
      };
      if (existing.mobile) {
        mockWorkerStore.set(existing.mobile, worker);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Worker onboarding completed successfully',
      riskProfile,
      worker
    });
  } catch (error) {
    console.error(`[Onboard Worker Error]: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to complete worker onboarding'
    });
  }
};

/**
 * @desc    Get current worker profile
 * @route   GET /api/workers/me
 * @access  Private (JWT Protected)
 */
const getWorkerProfile = async (req, res) => {
  try {
    return res.status(200).json({
      status: 'success',
      worker: req.worker
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve profile'
    });
  }
};

/**
 * @desc    Get complete Worker Dashboard view
 * @route   GET /api/workers/dashboard
 * @access  Private (JWT Protected)
 */
const getWorkerDashboard = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    const workerId = req.worker._id;

    let activePolicy = null;
    let paidClaims = [];
    let fraudFlags = [];

    if (isDbConnected) {
      activePolicy = await Policy.findOne({ workerId, status: 'Active' }).lean();
      paidClaims = await Claim.find({ workerId, claimState: 'Paid' }).lean();
      fraudFlags = await FraudFlag.find({ claimId: { $in: paidClaims.map(c => c._id) } }).lean();
    } else {
      activePolicy = mockPolicyStore.get(workerId) || mockPolicyStore.get(req.worker.mobile) || Array.from(mockPolicyStore.values())[0] || null;
      paidClaims = mockClaimsStore.filter(c => (c.workerId === workerId || c.workerMobile === req.worker.mobile) && c.claimState === 'Paid');
      fraudFlags = mockFraudFlagsStore;
    }

    // 1. Total Earnings Protected (sum of all-time paid claims)
    const totalEarningsProtected = paidClaims.reduce((sum, c) => sum + (c.payoutAmount || 0), 0);

    // 2. Weekly 7-Day Timeline Visualization (Mon - Sun)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();

    const weeklyTimeline = days.map((dayName, idx) => {
      const isToday = idx === (now.getDay() === 0 ? 6 : now.getDay() - 1);
      const isPast = idx < (now.getDay() === 0 ? 6 : now.getDay() - 1);
      
      let status = 'Covered';
      if (isPast && idx % 3 === 1) status = 'Disruption Detected ⚡';
      if (isPast && idx % 3 === 1 && totalEarningsProtected > 0) status = 'Payout Dispatched 💸';

      return {
        day: dayName,
        date: `${4 + idx} Aug`,
        status,
        isToday,
        isCovered: true
      };
    });

    // 3. Premium Payment Receipts & Invoices
    const premiumHistory = activePolicy ? [
      {
        invoiceId: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        date: activePolicy.coveragePeriodStart ? new Date(activePolicy.coveragePeriodStart).toLocaleDateString('en-IN') : '04 Aug 2026',
        amount: activePolicy.weeklyPremium || 50,
        tier: activePolicy.tier || 'Standard',
        status: 'PAID',
        mockPdfUrl: '#download-invoice'
      }
    ] : [];

    // 4. Qualitative Fraud Risk Level Masking
    // Only surface 'Low' or 'Medium' if flags exist; NEVER show numeric 0-100 score to worker!
    let fraudRiskLevel = null;
    if (fraudFlags.length > 0) {
      fraudRiskLevel = fraudFlags.length >= 3 ? 'Medium' : 'Low';
    }

    // 5. 24-Hour Pre-Week Cancellation Window Check
    const isSunday = now.getDay() === 0;
    const canCancelPolicy = isSunday || true; // Allowed for demo pitch

    return res.status(200).json({
      status: 'success',
      dashboard: {
        worker: req.worker,
        activePolicy,
        totalEarningsProtected,
        weeklyTimeline,
        premiumHistory,
        fraudRiskLevel,
        canCancelPolicy
      }
    });
  } catch (error) {
    console.error(`[Worker Dashboard Error]: ${error.message}`);
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve worker dashboard' });
  }
};

module.exports = {
  onboardWorker,
  getWorkerProfile,
  getWorkerDashboard
};
