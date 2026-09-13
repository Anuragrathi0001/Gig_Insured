const supabase = require('../config/supabase');
const payoutEngine = require('../services/payoutEngine');
const fraudEngine = require('../services/fraudEngine');
const razorpayMock = require('../integrations/razorpayMock');
const { mockPolicyStore } = require('./policyController');
const { mockWorkerStore } = require('./authController');

// In-memory mock claim store for offline DB fallback
const initialMockClaims = [
  {
    id: 'claim_demo_01',
    claimId: '81_781',
    worker_id: 'mock_worker_demo',
    disruption_type: 'Rain',
    claim_state: 'Paid',
    payout_amount: 284,
    transaction_ref: 'RZP_PYUT_PQJDEY9C',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'claim_demo_02',
    claimId: '92_529',
    worker_id: 'mock_worker_demo',
    disruption_type: 'Rain',
    claim_state: 'Paid',
    payout_amount: 429,
    transaction_ref: 'RZP_PYUT_UAR6HZX8',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'claim_demo_03',
    claimId: '92_452',
    worker_id: 'mock_worker_demo',
    disruption_type: 'Rain',
    claim_state: 'Paid',
    payout_amount: 429,
    transaction_ref: 'RZP_PYUT_QD2Q0FOW',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'claim_demo_04',
    claimId: '91_915',
    worker_id: 'mock_worker_demo',
    disruption_type: 'Rain',
    claim_state: 'Paid',
    payout_amount: 429,
    transaction_ref: 'RZP_PYUT_3NA8BLJG',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'claim_demo_05',
    claimId: '88_120',
    worker_id: 'mock_worker_demo',
    disruption_type: 'Rain',
    claim_state: 'Paid',
    payout_amount: 350,
    transaction_ref: 'RZP_PYUT_DEMO8812',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  },
  {
    id: 'claim_demo_06',
    claimId: '85_401',
    worker_id: 'mock_worker_demo',
    disruption_type: 'Heat',
    claim_state: 'Paid',
    payout_amount: 300,
    transaction_ref: 'RZP_PYUT_DEMO8540',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString()
  },
  {
    id: 'claim_demo_07',
    claimId: '82_930',
    worker_id: 'mock_worker_demo',
    disruption_type: 'Flood',
    claim_state: 'Paid',
    payout_amount: 500,
    transaction_ref: 'RZP_PYUT_DEMO8293',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString()
  },
  {
    id: 'claim_demo_08',
    claimId: '79_114',
    worker_id: 'mock_worker_demo',
    disruption_type: 'AQI',
    claim_state: 'Paid',
    payout_amount: 250,
    transaction_ref: 'RZP_PYUT_DEMO7911',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString()
  }
];

const mockClaimsStore = [...initialMockClaims];

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
  if (supabase) {
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

    if (supabase) {
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

        const requiresOtp = false;
        let initialClaimState = fraudResult.claimState;
        let transactionRef = null;

        if (initialClaimState === 'Auto-Approved') {
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

        const requiresOtp = false;
        let initialClaimState = fraudResult.claimState;
        let transactionRef = null;

        if (initialClaimState === 'Auto-Approved') {
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
 * @desc    Get current worker's claims (with pagination support)
 * @route   GET /api/claims/my-claims?page=1&limit=5
 */
const getMyClaims = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 5));
    const offset = (page - 1) * limit;

    let claims = [];
    let total = 0;

    if (supabase) {
      const { count: totalCount, error: countErr } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('worker_id', req.worker.id);

      if (countErr) throw new Error(countErr.message);

      total = totalCount || 0;

      const { data, error } = await supabase
        .from('claims')
        .select('*, trigger_events(*)')
        .eq('worker_id', req.worker.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new Error(error.message);
      claims = data || [];
    } else {
      const allWorkerClaims = mockClaimsStore.filter(c =>
        (req.worker.id && c.worker_id === req.worker.id) ||
        (req.worker.mobile && c.workerMobile === req.worker.mobile) ||
        (req.worker.worker_id && c.worker_id === req.worker.worker_id)
      );
      total = allWorkerClaims.length;
      claims = allWorkerClaims.slice(offset, offset + limit);
    }

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return res.status(200).json({
      status: 'success',
      count: claims.length,
      total,
      page,
      limit,
      totalPages,
      hasMore,
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

    if (supabase) {
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

    if (supabase) {
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

    if (supabase) {
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

    if (supabase) {
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

    if (supabase) {
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
