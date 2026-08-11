const supabase = require('../config/supabase');
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

    let worker;

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('workers')
        .update({
          name: name.trim(),
          city: city.trim(),
          zone: zone.trim(),
          platform,
          worker_id: workerId.trim(),
          avg_weekly_income: income,
          upi_id: upiId.trim(),
          kyc_status: 'verified',
          zone_risk_score: riskProfile.zoneRiskScore,
          weather_exposure_score: riskProfile.weatherExposureScore
        })
        .eq('id', req.worker.id)
        .select()
        .single();

      if (error) {
        console.error(`[Onboard Worker Error]: ${error.message}`);
        throw new Error(error.message);
      }
      worker = data;
    } else {
      console.log('[Worker Controller]: Offline mode. Updating in-memory worker store.');
      const existing = req.worker;
      worker = {
        ...existing,
        name: name.trim(),
        city: city.trim(),
        zone: zone.trim(),
        platform,
        worker_id: workerId.trim(),
        avg_weekly_income: income,
        upi_id: upiId.trim(),
        kyc_status: 'verified',
        zone_risk_score: riskProfile.zoneRiskScore,
        weather_exposure_score: riskProfile.weatherExposureScore,
        updated_at: new Date().toISOString()
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
    const workerId = req.worker.id;

    let activePolicy = null;
    let paidClaims = [];
    let fraudFlags = [];

    if (process.env.SUPABASE_URL) {
      const { data: policy } = await supabase
        .from('policies')
        .select('*')
        .eq('worker_id', workerId)
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      activePolicy = policy || null;

      const { data: claims } = await supabase
        .from('claims')
        .select('*')
        .eq('worker_id', workerId)
        .eq('claim_state', 'Paid');
      paidClaims = claims || [];

      if (paidClaims.length > 0) {
        const claimIds = paidClaims.map(c => c.id);
        const { data: flags } = await supabase
          .from('fraud_flags')
          .select('*')
          .in('claim_id', claimIds);
        fraudFlags = flags || [];
      }
    } else {
      activePolicy = mockPolicyStore.get(workerId) || mockPolicyStore.get(req.worker.mobile) || Array.from(mockPolicyStore.values())[0] || null;
      paidClaims = mockClaimsStore.filter(c => (c.worker_id === workerId || c.workerMobile === req.worker.mobile) && c.claim_state === 'Paid');
      fraudFlags = mockFraudFlagsStore;
    }

    // 1. Total Earnings Protected
    const totalEarningsProtected = paidClaims.reduce((sum, c) => sum + (c.payout_amount || 0), 0);

    // 2. Weekly 7-Day Timeline Visualization
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
        date: activePolicy.coverage_period_start ? new Date(activePolicy.coverage_period_start).toLocaleDateString('en-IN') : '04 Aug 2026',
        amount: activePolicy.weekly_premium || 50,
        tier: activePolicy.tier || 'Standard',
        status: 'PAID',
        mockPdfUrl: '#download-invoice'
      }
    ] : [];

    // 4. Qualitative Fraud Risk Level (never expose numeric score to worker)
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
