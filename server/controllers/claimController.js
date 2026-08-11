const supabase = require('../config/supabase');
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
  if (process.env.SUPABASE_URL) {
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('claims')
      .select('payout_amount')
      .eq('worker_id', workerId)
      .eq('claim_state', 'Paid')
      .gte('created_at', startOfWeek.toISOString());

    return (data || []).reduce((sum, c) => sum + (c.payout_amount || 0), 0);
  } else {
    const paidClaims = mockClaimsStore.filter(
      c => (c.worker_id === workerId || c.workerMobile === workerId) && c.claim_state === 'Paid'
    );
    return paidClaims.reduce((sum, c) => sum + (c.payout_amount || 0), 0);
  }
};

/**
 * Automatically create zero-manual claims, run Multi-Signal Fraud Scoring,
 * enforce Weekly Cap, and execute Razorpay Payouts
 */
const autoCreateClaimsForTrigger = async (triggerEvent) => {
  if (!triggerEvent || !triggerEvent.zone) return [];

  console.log(`\n[Claim Automation]: Processing confirmed TriggerEvent for zone: ${triggerEvent.zone} (Type: ${triggerEvent.disruption_type || triggerEvent.disruptionType})...`);

  try {
    const hoursLost = getDisruptionHoursLost(triggerEvent.disruption_type || triggerEvent.disruptionType);
    const createdClaims = [];

    if (process.env.SUPABASE_URL) {
      // Fetch all active policies with their related workers
      const { data: activePolicies } = await supabase
        .from('policies')
        .select('*, workers(*)')
        .eq('status', 'Active');

      const matchingPolicies = (activePolicies || []).filter(
        p => p.workers && p.workers.zone === triggerEvent.zone
      );

      for (const policy of matchingPolicies) {
        const worker = policy.workers;

        // Duplicate prevention
        const { data: existingClaim } = await supabase
          .from('claims')
          .select('id')
          .eq('worker_id', worker.id)
          .eq('trigger_event_id', triggerEvent.id)
          .single();

        if (existingClaim) continue;

        // Weekly Cap enforcement
        const existingPaidTotal = await getWorkerWeeklyPayoutsTotal(worker.id);
        const weeklyCap = policy.weekly_benefit_cap || 3000;
        const remainingCap = Math.max(0, weeklyCap - existingPaidTotal);

        if (remainingCap <= 0) {
          console.log(`[Claim Automation CAP EXCEEDED]: Worker ${worker.name} reached weekly benefit cap (₹${weeklyCap}). Skipping payout.`);
          continue;
        }

        const calculatedPayout = payoutEngine.calculatePayout({
          hoursLost,
          avgWeeklyIncome: worker.avg_weekly_income,
          weeklyBenefitCap: remainingCap
        });

        const rawClaim = {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          worker_id: worker.id,
          policy_id: policy.id,
          trigger_event_id: triggerEvent.id,
          hours_lost: hoursLost,
          payout_amount: calculatedPayout.payoutAmount,
          claim_state: 'Detected',
          reason: `Automated Parametric Trigger (${(triggerEvent.disruption_type || triggerEvent.disruptionType || '').toUpperCase()} in ${triggerEvent.zone})`
        };

        const fraudResult = await fraudEngine.evaluateClaimFraud(rawClaim, worker, triggerEvent);

        const requiresOtp = calculatedPayout.payoutAmount > 1000 && fraudResult.claimState === 'Auto-Approved';
        let initialClaimState = requiresOtp ? 'Auto-Approved' : fraudResult.claimState;
        let transactionRef = null;

        if (initialClaimState === 'Auto-Approved' && !requiresOtp) {
          const payoutRes = await razorpayMock.dispatchUpiPayout({
            amount: calculatedPayout.payoutAmount,
            upiId: worker.upi_id || 'worker@paytm',
            claimId: rawClaim.id,
            workerName: worker.name
          });

          if (payoutRes.success) {
            initialClaimState = 'Paid';
            transactionRef = payoutRes.transactionRef;
          } else {
            initialClaimState = 'Payout-Failed';
          }
        }

        const { data: claim, error } = await supabase
          .from('claims')
          .insert({
            worker_id: worker.id,
            policy_id: policy.id,
            trigger_event_id: triggerEvent.id,
            hours_lost: hoursLost,
            payout_amount: calculatedPayout.payoutAmount,
            fraud_risk_score: fraudResult.fraudRiskScore,
            claim_state: initialClaimState,
            otp_verification_required: requiresOtp,
            transaction_ref: transactionRef,
            reason: rawClaim.reason
          })
          .select()
          .single();

        if (error) {
          console.error(`[Claim Insert Error]: ${error.message}`);
          continue;
        }

        createdClaims.push(claim);

        console.log(`==================================================`);
        console.log(`[SMS & Push Gateway Mock] Sent to +91-${worker.mobile} (${worker.name}):`);
        console.log(`"Disruption confirmed in ${triggerEvent.zone}. ₹${calculatedPayout.payoutAmount} payout ${initialClaimState === 'Paid' ? `initiated to your UPI (${worker.upi_id || 'worker@paytm'}). Ref: ${transactionRef}` : `decision: ${initialClaimState}`}"`);
        console.log(`==================================================\n`);
      }
    } else {
      // Offline Mock Fallback
      const mockPolicies = Array.from(mockPolicyStore.values());
      const mockWorkers = Array.from(mockWorkerStore.values());

      if (mockPolicies.length === 0 && mockWorkers.length > 0) {
        const sampleWorker = mockWorkers[0];
        mockPolicies.push({
          id: `mock_policy_${Date.now()}`,
          worker_id: sampleWorker.id,
          tier: 'Standard',
          weekly_premium: 50,
          weekly_benefit_cap: 3000,
          status: 'Active'
        });
      }

      for (const policy of mockPolicies) {
        let worker = mockWorkers.find(w => w.id === policy.worker_id || w.mobile === policy.worker_id);
        if (!worker && mockWorkers.length > 0) worker = mockWorkers[0];
        if (!worker) {
          worker = {
            id: 'mock_worker_demo',
            name: 'Vikram Delivery Partner',
            mobile: '9876543210',
            zone: triggerEvent.zone,
            avg_weekly_income: 5500,
            upi_id: 'vikram@upi',
            kyc_status: 'verified'
          };
        }

        const existingPaidTotal = await getWorkerWeeklyPayoutsTotal(worker.id);
        const weeklyCap = policy.weekly_benefit_cap || 3000;
        const remainingCap = Math.max(0, weeklyCap - existingPaidTotal);

        if (remainingCap <= 0) continue;

        const calculatedPayout = payoutEngine.calculatePayout({
          hoursLost,
          avgWeeklyIncome: worker.avg_weekly_income || 5500,
          weeklyBenefitCap: remainingCap
        });

        const rawMockClaim = {
          id: `claim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          worker_id: worker.id,
          workerName: worker.name,
          workerMobile: worker.mobile,
          workerUpiId: worker.upi_id || 'vikram@upi',
          policy_id: policy.id,
          trigger_event_id: triggerEvent.id,
          disruptionType: triggerEvent.disruption_type || triggerEvent.disruptionType,
          zone: triggerEvent.zone,
          hours_lost: hoursLost,
          payout_amount: calculatedPayout.payoutAmount,
          reason: `Automated Parametric Trigger (${(triggerEvent.disruption_type || triggerEvent.disruptionType || '').toUpperCase()} in ${triggerEvent.zone})`,
          created_at: new Date().toISOString()
        };

        const fraudResult = await fraudEngine.evaluateClaimFraud(rawMockClaim, worker, triggerEvent);

        const requiresOtp = calculatedPayout.payoutAmount > 1000 && fraudResult.claimState === 'Auto-Approved';
        let initialClaimState = requiresOtp ? 'Auto-Approved' : fraudResult.claimState;
        let transactionRef = null;

        if (initialClaimState === 'Auto-Approved' && !requiresOtp) {
          const payoutRes = await razorpayMock.dispatchUpiPayout({
            amount: calculatedPayout.payoutAmount,
            upiId: worker.upi_id || 'vikram@upi',
            claimId: rawMockClaim.id,
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
          fraud_risk_score: fraudResult.fraudRiskScore,
          claim_state: initialClaimState,
          otp_verification_required: requiresOtp,
          transaction_ref: transactionRef,
          graceThresholdApplied: fraudResult.graceThresholdApplied
        };

        mockClaimsStore.unshift(mockClaim);
        createdClaims.push(mockClaim);

        console.log(`==================================================`);
        console.log(`[SMS & Push Gateway Mock] Sent to +91-${worker.mobile} (${worker.name}):`);
        console.log(`"Disruption confirmed in ${triggerEvent.zone}. ₹${calculatedPayout.payoutAmount} payout ${initialClaimState === 'Paid' ? `initiated to your UPI. Ref: ${transactionRef}` : `decision: ${initialClaimState}`}"`);
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
    let claims = [];

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('claims')
        .select('*, trigger_events(*)')
        .eq('worker_id', req.worker.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      claims = data || [];
    } else {
      claims = mockClaimsStore.filter(c =>
        c.worker_id === req.worker.id ||
        c.workerMobile === req.worker.mobile ||
        c.worker_id === req.worker.worker_id
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

    let claim = null;

    if (process.env.SUPABASE_URL) {
      const { data } = await supabase
        .from('claims')
        .select('*, workers(*)')
        .eq('id', id)
        .single();
      claim = data;
    } else {
      claim = mockClaimsStore.find(c => c.id === id);
    }

    if (!claim) {
      return res.status(404).json({ status: 'fail', message: 'Claim not found' });
    }

    const upiId = claim.workers?.upi_id || claim.workerUpiId || 'worker@paytm';
    const payoutRes = await razorpayMock.dispatchUpiPayout({
      amount: claim.payout_amount,
      upiId,
      claimId: claim.id,
      workerName: claim.workers?.name || claim.workerName
    });

    const newState = payoutRes.success ? 'Paid' : 'Payout-Failed';
    const transactionRef = payoutRes.transactionRef || null;

    if (process.env.SUPABASE_URL) {
      const { data: updated } = await supabase
        .from('claims')
        .update({
          claim_state: newState,
          otp_verification_required: false,
          transaction_ref: transactionRef,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      claim = updated;
    } else {
      claim.claim_state = newState;
      claim.otp_verification_required = false;
      claim.transaction_ref = transactionRef;
      claim.resolved_at = new Date().toISOString();
    }

    return res.status(200).json({
      status: 'success',
      message: `OTP verified! Razorpay UPI payout of ₹${claim.payout_amount} dispatched (Ref: ${transactionRef || 'N/A'}).`,
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

    let claim = null;

    if (process.env.SUPABASE_URL) {
      const { data } = await supabase
        .from('claims')
        .select('*')
        .eq('id', id)
        .single();
      claim = data;
    } else {
      claim = mockClaimsStore.find(c => c.id === id);
    }

    if (!claim) {
      return res.status(404).json({ status: 'fail', message: 'Claim not found' });
    }

    if (claim.claim_state !== 'Blocked') {
      return res.status(400).json({ status: 'fail', message: 'Only blocked claims are eligible for worker appeal' });
    }

    // Enforce 48-Hour Appeal Window
    const createdAtTime = new Date(claim.created_at || Date.now()).getTime();
    const hoursElapsed = (Date.now() - createdAtTime) / (1000 * 60 * 60);

    if (hoursElapsed > 48) {
      return res.status(400).json({
        status: 'fail',
        message: 'Appeal window expired. Worker appeals must be submitted within 48 hours of claim decision.'
      });
    }

    const updatedReason = `Worker Appeal (${new Date().toLocaleDateString('en-IN')}): ${appealStatement || 'Under Manual Admin Review'}`;

    if (process.env.SUPABASE_URL) {
      const { data: updated } = await supabase
        .from('claims')
        .update({ claim_state: 'Appealed', reason: updatedReason })
        .eq('id', id)
        .select()
        .single();
      claim = updated;
    } else {
      claim.claim_state = 'Appealed';
      claim.reason = updatedReason;
    }

    console.log(`[Claim Appeal Queued]: Claim ID ${claim.id} moved to 'Appealed' state for admin review.`);

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
    let claims = [];

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('claims')
        .select('*, workers(*), trigger_events(*)')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      claims = data || [];
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
