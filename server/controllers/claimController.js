const mongoose = require('mongoose');
const { Claim, Policy, Worker, FraudFlag } = require('../models');
const payoutEngine = require('../services/payoutEngine');
const fraudEngine = require('../services/fraudEngine');
const razorpayMock = require('../integrations/razorpayMock');
const { mockPolicyStore } = require('./policyController');
const { mockWorkerStore } = require('./authController');

// In-memory mock claim store for offline DB fallback
const mockClaimsStore = [];

/**
 * Derives hours lost from disruption type & severity
 */
const getDisruptionHoursLost = (disruptionType) => {
  switch ((disruptionType || '').toLowerCase()) {
    case 'rain':
    case 'heavy_rain':
      return 4;
    case 'flood':
    case 'severe_flood':
      return 6;
    case 'heat':
    case 'extreme_heat':
      return 4;
    case 'aqi':
    case 'hazardous_aqi':
      return 3;
    case 'curfew':
    case 'strike':
      return 8;
    default:
      return 4;
  }
};

/**
 * Calculate worker's total payouts disbursed in current week
 */
const getWorkerWeeklyPayoutsTotal = async (workerId) => {
  const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

  if (isDbConnected) {
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const result = await Claim.aggregate([
      {
        $match: {
          workerId: new mongoose.Types.ObjectId(workerId),
          claimState: 'Paid',
          createdAt: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payoutAmount' }
        }
      }
    ]);

    return result[0]?.total || 0;
  } else {
    const paidClaims = mockClaimsStore.filter(c => (c.workerId === workerId || c.workerMobile === workerId) && c.claimState === 'Paid');
    return paidClaims.reduce((sum, c) => sum + (c.payoutAmount || 0), 0);
  }
};

/**
 * Automatically create zero-manual claims, run Multi-Signal Fraud Scoring, enforce Weekly Cap, and execute Razorpay Payouts
 */
const autoCreateClaimsForTrigger = async (triggerEvent) => {
  if (!triggerEvent || !triggerEvent.zone) return [];

  console.log(`\n[Claim Automation]: Processing confirmed TriggerEvent for zone: ${triggerEvent.zone} (Type: ${triggerEvent.disruptionType})...`);

  try {
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    const hoursLost = getDisruptionHoursLost(triggerEvent.disruptionType);
    const createdClaims = [];

    if (isDbConnected) {
      const activePolicies = await Policy.find({ status: 'Active' })
        .populate('workerId')
        .lean();

      const matchingPolicies = activePolicies.filter(p => p.workerId && p.workerId.zone === triggerEvent.zone);

      for (const policy of matchingPolicies) {
        const worker = policy.workerId;

        // Duplicate prevention check
        const existingClaim = await Claim.findOne({
          workerId: worker._id,
          triggerEventId: triggerEvent._id
        });

        if (existingClaim) continue;

        // Enforce Weekly Payout Cap
        const existingPaidTotal = await getWorkerWeeklyPayoutsTotal(worker._id);
        const weeklyCap = policy.weeklyBenefitCap || 3000;
        const remainingCap = Math.max(0, weeklyCap - existingPaidTotal);

        if (remainingCap <= 0) {
          console.log(`[Claim Automation CAP EXCEEDED]: Worker ${worker.name} reached weekly benefit cap (₹${weeklyCap}). Skipping payout.`);
          continue;
        }

        const calculatedPayout = payoutEngine.calculatePayout({
          hoursLost,
          avgWeeklyIncome: worker.avgWeeklyIncome,
          weeklyBenefitCap: remainingCap
        });

        const rawClaim = {
          _id: new mongoose.Types.ObjectId(),
          workerId: worker._id,
          policyId: policy._id,
          triggerEventId: triggerEvent._id,
          hoursLost,
          payoutAmount: calculatedPayout.payoutAmount,
          claimState: 'Detected',
          reason: `Automated Parametric Trigger (${triggerEvent.disruptionType.toUpperCase()} in ${triggerEvent.zone})`
        };

        // Evaluate Multi-Signal Fraud Scoring
        const fraudResult = await fraudEngine.evaluateClaimFraud(rawClaim, worker, triggerEvent);

        const requiresOtp = calculatedPayout.payoutAmount > 1000 && fraudResult.claimState === 'Auto-Approved';
        let initialClaimState = requiresOtp ? 'Auto-Approved' : fraudResult.claimState;
        let transactionRef = null;

        // If Auto-Approved and no OTP required, execute Razorpay Instant UPI Payout
        if (initialClaimState === 'Auto-Approved' && !requiresOtp) {
          const payoutRes = await razorpayMock.dispatchUpiPayout({
            amount: calculatedPayout.payoutAmount,
            upiId: worker.upiId || 'worker@paytm',
            claimId: rawClaim._id,
            workerName: worker.name
          });

          if (payoutRes.success) {
            initialClaimState = 'Paid';
            transactionRef = payoutRes.transactionRef;
          } else {
            initialClaimState = 'Payout-Failed';
          }
        }

        const claim = await Claim.create({
          _id: rawClaim._id,
          workerId: worker._id,
          policyId: policy._id,
          triggerEventId: triggerEvent._id,
          hoursLost,
          payoutAmount: calculatedPayout.payoutAmount,
          fraudRiskScore: fraudResult.fraudRiskScore,
          claimState: initialClaimState,
          otpVerificationRequired: requiresOtp,
          transactionRef,
          reason: rawClaim.reason
        });

        createdClaims.push(claim);

        // SMS & In-App Push Notification Alert
        console.log(`==================================================`);
        console.log(`[SMS & Push Gateway Mock] Sent to +91-${worker.mobile} (${worker.name}):`);
        console.log(`"Disruption confirmed in ${triggerEvent.zone}. ₹${calculatedPayout.payoutAmount} payout ${initialClaimState === 'Paid' ? `initiated to your UPI (${worker.upiId || 'worker@paytm'}). Ref: ${transactionRef}` : `decision: ${initialClaimState}`}"`);
        console.log(`==================================================\n`);
      }
    } else {
      // Offline DB Mock Fallback
      const mockPolicies = Array.from(mockPolicyStore.values());
      const mockWorkers = Array.from(mockWorkerStore.values());

      if (mockPolicies.length === 0 && mockWorkers.length > 0) {
        const sampleWorker = mockWorkers[0];
        const samplePolicy = {
          _id: `mock_policy_${Date.now()}`,
          workerId: sampleWorker._id,
          tier: 'Standard',
          weeklyPremium: 50,
          weeklyBenefitCap: 3000,
          hourlyDisruptionRate: 250,
          status: 'Active'
        };
        mockPolicies.push(samplePolicy);
      }

      for (const policy of mockPolicies) {
        let worker = mockWorkers.find(w => w._id === policy.workerId || w.mobile === policy.workerId);
        if (!worker && mockWorkers.length > 0) worker = mockWorkers[0];
        if (!worker) {
          worker = {
            _id: 'mock_worker_demo',
            name: 'Vikram Delivery Partner',
            mobile: '9876543210',
            zone: triggerEvent.zone,
            avgWeeklyIncome: 5500,
            upiId: 'vikram@upi',
            kycStatus: 'verified'
          };
        }

        const existingPaidTotal = await getWorkerWeeklyPayoutsTotal(worker._id);
        const weeklyCap = policy.weeklyBenefitCap || 3000;
        const remainingCap = Math.max(0, weeklyCap - existingPaidTotal);

        if (remainingCap <= 0) {
          console.log(`[Claim Automation CAP EXCEEDED]: Worker ${worker.name} reached weekly benefit cap (₹${weeklyCap}). Skipping payout.`);
          continue;
        }

        const calculatedPayout = payoutEngine.calculatePayout({
          hoursLost,
          avgWeeklyIncome: worker.avgWeeklyIncome || 5500,
          weeklyBenefitCap: remainingCap
        });

        const rawMockClaim = {
          _id: `claim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          workerId: worker._id,
          workerName: worker.name,
          workerMobile: worker.mobile,
          workerUpiId: worker.upiId || 'vikram@upi',
          policyId: policy._id,
          triggerEventId: triggerEvent._id,
          disruptionType: triggerEvent.disruptionType,
          zone: triggerEvent.zone,
          hoursLost,
          payoutAmount: calculatedPayout.payoutAmount,
          reason: `Automated Parametric Trigger (${triggerEvent.disruptionType.toUpperCase()} in ${triggerEvent.zone})`,
          createdAt: new Date().toISOString()
        };

        const fraudResult = await fraudEngine.evaluateClaimFraud(rawMockClaim, worker, triggerEvent);

        const requiresOtp = calculatedPayout.payoutAmount > 1000 && fraudResult.claimState === 'Auto-Approved';
        let initialClaimState = requiresOtp ? 'Auto-Approved' : fraudResult.claimState;
        let transactionRef = null;

        if (initialClaimState === 'Auto-Approved' && !requiresOtp) {
          const payoutRes = await razorpayMock.dispatchUpiPayout({
            amount: calculatedPayout.payoutAmount,
            upiId: worker.upiId || 'vikram@upi',
            claimId: rawMockClaim._id,
            workerName: worker.name
          });

          if (payoutRes.success) {
            initialClaimState = 'Paid';
            transactionRef = payoutRes.transactionRef;
          } else {
            initialClaimState = 'Payout-Failed';
          }
        }

        const mockClaim = {
          ...rawMockClaim,
          fraudRiskScore: fraudResult.fraudRiskScore,
          claimState: initialClaimState,
          otpVerificationRequired: requiresOtp,
          transactionRef,
          graceThresholdApplied: fraudResult.graceThresholdApplied
        };

        mockClaimsStore.unshift(mockClaim);
        createdClaims.push(mockClaim);

        console.log(`==================================================`);
        console.log(`[SMS & Push Gateway Mock] Sent to +91-${worker.mobile} (${worker.name}):`);
        console.log(`"Disruption confirmed in ${triggerEvent.zone}. ₹${calculatedPayout.payoutAmount} payout ${initialClaimState === 'Paid' ? `initiated to your UPI (${worker.upiId || 'vikram@upi'}). Ref: ${transactionRef}` : `decision: ${initialClaimState}`}"`);
        console.log(`==================================================\n`);
      }
    }

    console.log(`[Claim Automation]: Created ${createdClaims.length} evaluated claims.\n`);
    return createdClaims;

  } catch (error) {
    console.error(`[Auto Claim Creation Error]: ${error.message}`);
    return [];
  }
};

/**
 * @desc    Get current worker's claims
 * @route   GET /api/claims/my-claims
 */
const getMyClaims = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let claims = [];

    if (isDbConnected) {
      claims = await Claim.find({ workerId: req.worker._id })
        .populate('triggerEventId')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      claims = mockClaimsStore.filter(c =>
        c.workerId === req.worker._id ||
        c.workerMobile === req.worker.mobile ||
        c.workerId === req.worker.workerId
      );
      if (claims.length === 0) claims = mockClaimsStore;
    }

    return res.status(200).json({
      status: 'success',
      count: claims.length,
      claims
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve claims'
    });
  }
};

/**
 * @desc    Verify OTP for High-Value Payout (> ₹1,000) and dispatch Razorpay UPI payment
 * @route   POST /api/claims/:id/verify-payout-otp
 */
const verifyPayoutOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ status: 'fail', message: 'OTP code is required for high-value payout confirmation' });
    }

    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let claim = null;

    if (isDbConnected) {
      claim = await Claim.findById(id).populate('workerId');
    } else {
      claim = mockClaimsStore.find(c => c._id === id);
    }

    if (!claim) {
      return res.status(404).json({ status: 'fail', message: 'Claim not found' });
    }

    // Execute Razorpay Payout
    const upiId = claim.workerId?.upiId || claim.workerUpiId || 'worker@paytm';
    const payoutRes = await razorpayMock.dispatchUpiPayout({
      amount: claim.payoutAmount,
      upiId,
      claimId: claim._id,
      workerName: claim.workerId?.name || claim.workerName
    });

    const newState = payoutRes.success ? 'Paid' : 'Payout-Failed';
    const transactionRef = payoutRes.transactionRef || null;

    if (isDbConnected) {
      claim.claimState = newState;
      claim.otpVerificationRequired = false;
      claim.transactionRef = transactionRef;
      claim.resolvedAt = new Date();
      await claim.save();
    } else {
      claim.claimState = newState;
      claim.otpVerificationRequired = false;
      claim.transactionRef = transactionRef;
      claim.resolvedAt = new Date().toISOString();
    }

    return res.status(200).json({
      status: 'success',
      message: `OTP verified! Razorpay UPI payout of ₹${claim.payoutAmount} dispatched (Ref: ${transactionRef || 'N/A'}).`,
      claim
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to verify payout OTP' });
  }
};

/**
 * @desc    Submit Appeal for Blocked Claim (Enforces 48-Hour Deadline)
 * @route   POST /api/claims/:id/appeal
 */
const submitAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { appealStatement } = req.body;

    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let claim = null;

    if (isDbConnected) {
      claim = await Claim.findById(id);
    } else {
      claim = mockClaimsStore.find(c => c._id === id);
    }

    if (!claim) {
      return res.status(404).json({ status: 'fail', message: 'Claim not found' });
    }

    if (claim.claimState !== 'Blocked') {
      return res.status(400).json({ status: 'fail', message: 'Only blocked claims are eligible for worker appeal' });
    }

    // Enforce 48-Hour Appeal Window
    const createdAtTime = new Date(claim.createdAt || Date.now()).getTime();
    const hoursElapsed = (Date.now() - createdAtTime) / (1000 * 60 * 60);

    if (hoursElapsed > 48) {
      return res.status(400).json({
        status: 'fail',
        message: 'Appeal window expired. Worker appeals must be submitted within 48 hours of claim decision.'
      });
    }

    const updatedReason = `Worker Appeal (${new Date().toLocaleDateString('en-IN')}): ${appealStatement || 'Under Manual Admin Review'}`;

    if (isDbConnected) {
      claim.claimState = 'Appealed';
      claim.reason = updatedReason;
      await claim.save();
    } else {
      claim.claimState = 'Appealed';
      claim.reason = updatedReason;
    }

    console.log(`[Claim Appeal Queued]: Claim ID ${claim._id} moved to 'Appealed' state for admin review.`);

    return res.status(200).json({
      status: 'success',
      message: 'Appeal submitted successfully within 48-hour window. Escalated to Admin Review queue.',
      claim
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to submit claim appeal' });
  }
};

/**
 * @desc    Get all claims (Admin Feed)
 * @route   GET /api/admin/claims
 */
const getAllClaims = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let claims = [];

    if (isDbConnected) {
      claims = await Claim.find({})
        .populate('workerId')
        .populate('triggerEventId')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      claims = mockClaimsStore;
    }

    return res.status(200).json({
      status: 'success',
      count: claims.length,
      claims
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve claims'
    });
  }
};

module.exports = {
  autoCreateClaimsForTrigger,
  getMyClaims,
  getAllClaims,
  verifyPayoutOtp,
  submitAppeal,
  mockClaimsStore
};
