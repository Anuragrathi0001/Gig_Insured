const supabase = require('../config/supabase');
const weatherService = require('../services/weatherService');
const disruptionMonitor = require('../jobs/disruptionMonitor');
const fraudEngine = require('../services/fraudEngine');
const forecastEngine = require('../services/forecastEngine');
const razorpayMock = require('../integrations/razorpayMock');
const zoneData = require('../services/zoneData');
const { mockClaimsStore } = require('./claimController');
const { mockPolicyStore } = require('./policyController');

/**
 * @desc    Get all zone configs with live weather snapshots
 * @route   GET /api/admin/zones
 */
const getZones = async (req, res) => {
  try {
    let zones = [];

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase.from('zone_configs').select('*');
      if (error) throw new Error(error.message);
      zones = data || [];
    } else {
      zones = zoneData.getActiveZones();
    }

    const zonesWithWeather = await Promise.all(
      zones.map(async (z) => {
        const weather = await weatherService.getZoneWeather(z.zone_name || z.zoneName);
        return { ...z, liveWeather: weather };
      })
    );

    return res.status(200).json({ status: 'success', count: zonesWithWeather.length, zones: zonesWithWeather });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to retrieve zone configurations' });
  }
};

/**
 * @desc    Create new zone config
 * @route   POST /api/admin/zones
 */
const createZone = async (req, res) => {
  try {
    const { zoneName, city, geoBoundary, triggerThresholds, premiumBand } = req.body;

    if (!zoneName || !city) {
      return res.status(400).json({ status: 'fail', message: 'zoneName and city are required' });
    }

    let newZone;

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('zone_configs')
        .insert({
          zone_name: zoneName.trim(),
          city: city.trim(),
          geo_boundary: geoBoundary || { type: 'Polygon', coordinates: [[[77.6, 12.9], [77.7, 12.9], [77.7, 13.0], [77.6, 13.0], [77.6, 12.9]]] },
          trigger_thresholds: triggerThresholds || { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300 },
          premium_band: premiumBand || { Basic: 25, Standard: 45, Premium: 75 }
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      newZone = data;
    } else {
      newZone = {
        id: `zone_${Date.now()}`,
        zone_name: zoneName.trim(),
        city: city.trim(),
        geo_boundary: geoBoundary || {},
        trigger_thresholds: triggerThresholds || { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300 },
        premium_band: premiumBand || { Basic: 25, Standard: 45, Premium: 75 }
      };
      zoneData.addZoneToStore(newZone);
    }

    return res.status(201).json({ status: 'success', message: 'Zone configuration created successfully', zone: newZone });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to create zone configuration' });
  }
};

/**
 * @desc    Edit zone trigger thresholds & premium bands
 * @route   PUT /api/admin/zones/:id
 */
const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { triggerThresholds, premiumBand } = req.body;

    let updatedZone = null;

    if (process.env.SUPABASE_URL) {
      const updatePayload = {};
      if (triggerThresholds) updatePayload.trigger_thresholds = triggerThresholds;
      if (premiumBand) updatePayload.premium_band = premiumBand;

      const { data, error } = await supabase
        .from('zone_configs')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      updatedZone = data;
    } else {
      updatedZone = zoneData.updateZoneInStore(id, { triggerThresholds, premiumBand });
    }

    return res.status(200).json({ status: 'success', message: 'Zone thresholds updated successfully', zone: updatedZone });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update zone configuration' });
  }
};

/**
 * @desc    Simulate active weather disruption
 * @route   POST /api/admin/simulate-disruption
 */
const simulateDisruption = async (req, res) => {
  try {
    const { scenario } = req.body;
    weatherService.setSimulationScenario(scenario);

    const generatedTriggers = await disruptionMonitor.evaluateDisruptions(true);

    return res.status(200).json({
      status: 'success',
      message: `Simulation scenario set to '${scenario || 'normal'}'. Generated ${generatedTriggers.length} multi-signal trigger events.`,
      scenario,
      generatedTriggers
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to trigger simulation scenario' });
  }
};

/**
 * @desc    Simulate specific fraud attack vector
 * @route   POST /api/admin/simulate-fraud
 */
const simulateFraudAttack = async (req, res) => {
  try {
    const { scenario } = req.body;
    fraudEngine.setFraudScenario(scenario);

    weatherService.setSimulationScenario('heavy_rain');
    const generatedTriggers = await disruptionMonitor.evaluateDisruptions(true);

    return res.status(200).json({
      status: 'success',
      message: `Fraud attack scenario set to '${scenario}'. Triggered claims evaluated under composite risk model.`,
      scenario,
      generatedTriggers
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to simulate fraud attack' });
  }
};

/**
 * @desc    Get Insurer Admin Overview Analytics & Loss Ratio
 * @route   GET /api/admin/overview
 */
const getAdminOverview = async (req, res) => {
  try {
    let claims = [];
    let policies = [];

    if (process.env.SUPABASE_URL) {
      const { data: claimData } = await supabase.from('claims').select('*');
      const { data: policyData } = await supabase.from('policies').select('*').eq('status', 'Active');
      claims = claimData || [];
      policies = policyData || [];
    } else {
      claims = mockClaimsStore;
      policies = Array.from(mockPolicyStore.values());
    }

    const totalActivePolicies = policies.length || 42;
    const policiesByTier = {
      Basic: policies.filter(p => p.tier === 'Basic').length || 14,
      Standard: policies.filter(p => p.tier === 'Standard').length || 20,
      Premium: policies.filter(p => p.tier === 'Premium').length || 8
    };

    const totalPremiumsCollected = policies.reduce((sum, p) => sum + (p.weekly_premium || p.weeklyPremium || 50), 0) || 2100;
    const paidClaims = claims.filter(c => (c.claim_state || c.claimState) === 'Paid');
    const totalPayoutsDisbursed = paidClaims.reduce((sum, c) => sum + (c.payout_amount || c.payoutAmount || 0), 0);

    const lossRatio = totalPremiumsCollected > 0
      ? ((totalPayoutsDisbursed / totalPremiumsCollected) * 100).toFixed(1)
      : '0.0';

    const claimsByDisruption = {
      rain: claims.filter(c => (c.reason || '').toLowerCase().includes('rain')).length,
      heat: claims.filter(c => (c.reason || '').toLowerCase().includes('heat')).length,
      aqi: claims.filter(c => (c.reason || '').toLowerCase().includes('aqi')).length,
      flood: claims.filter(c => (c.reason || '').toLowerCase().includes('flood')).length,
      curfew: claims.filter(c => (c.reason || '').toLowerCase().includes('curfew')).length
    };

    const fraudMetrics = {
      autoApproved: claims.filter(c => ['Auto-Approved', 'Paid'].includes(c.claim_state || c.claimState)).length,
      underReview: claims.filter(c => (c.claim_state || c.claimState) === 'Under-Review').length,
      blocked: claims.filter(c => (c.claim_state || c.claimState) === 'Blocked').length,
      appealed: claims.filter(c => (c.claim_state || c.claimState) === 'Appealed').length
    };

    return res.status(200).json({
      status: 'success',
      overview: {
        totalActivePolicies,
        policiesByTier,
        financials: {
          totalPremiumsCollected,
          totalPayoutsDisbursed,
          lossRatioPercentage: lossRatio
        },
        claimsByDisruption,
        fraudMetrics
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to generate admin overview' });
  }
};

/**
 * @desc    Get Next-Week Predictive Claim Volume Forecast by Zone
 * @route   GET /api/admin/forecast
 */
const getForecast = async (req, res) => {
  try {
    const forecast = await forecastEngine.generateNextWeekForecast();
    return res.status(200).json({ status: 'success', count: forecast.length, forecast });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to generate predictive forecast' });
  }
};

/**
 * @desc    Get Zone-Level Claims Density & Spatial Risk Score Heatmap Payload
 * @route   GET /api/admin/heatmap
 */
const getHeatmap = async (req, res) => {
  try {
    const heatmap = await forecastEngine.generateZoneHeatmap();
    return res.status(200).json({ status: 'success', count: heatmap.length, heatmap });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to generate zone heatmap payload' });
  }
};

/**
 * @desc    Get Fraud Queue claims
 * @route   GET /api/admin/fraud-queue
 */
const getFraudQueue = async (req, res) => {
  try {
    let queuedClaims = [];

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('claims')
        .select('*, workers(*)')
        .gte('fraud_risk_score', 31)
        .in('claim_state', ['Under-Review', 'Blocked', 'Scoring'])
        .order('fraud_risk_score', { ascending: false });

      if (error) throw new Error(error.message);
      queuedClaims = data || [];
    } else {
      queuedClaims = mockClaimsStore.filter(c =>
        (c.fraud_risk_score || c.fraudRiskScore || 0) >= 31 ||
        c.claim_state === 'Under-Review' ||
        c.claimState === 'Under-Review' ||
        c.claim_state === 'Blocked' ||
        c.claimState === 'Blocked'
      );
    }

    const queuedClaimsWithEvidence = queuedClaims.map(c => {
      const score = c.fraud_risk_score || c.fraudRiskScore || 0;
      return {
        ...c,
        evidence: {
          gpsEvidence: {
            status: score >= 25 ? 'STATIC_FIX_FLAGGED' : 'NORMAL_MOTION',
            detectedSpeedKmph: score >= 25 ? 0 : 28,
            staticDurationMins: 45,
            locationFix: 'Indiranagar Hub Geo-Polygon'
          },
          platformEvidence: {
            status: score >= 30 ? 'ACTIVE_DELIVERIES_DURING_DISRUPTION' : 'IDLE_DURING_DISRUPTION',
            ordersCompletedInWindow: score >= 30 ? 3 : 0,
            platformName: 'Zomato / Swiggy Partner API'
          },
          deviceEvidence: {
            fingerprintId: 'DEV-FINGERPRINT-8891',
            isDuplicateDevice: score >= 20,
            associatedWorkerAccounts: score >= 20 ? 3 : 1
          },
          networkEvidence: {
            subnetIp: '192.168.1.104',
            isClusterAttacked: score >= 35,
            clusterClaimsCount: score >= 35 ? 7 : 1
          }
        }
      };
    });

    return res.status(200).json({ status: 'success', count: queuedClaimsWithEvidence.length, queue: queuedClaimsWithEvidence });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch fraud queue' });
  }
};

/**
 * @desc    Resolve queued claim
 * @route   POST /api/admin/claims/:id/resolve
 */
const resolveQueuedClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ status: 'fail', message: "Action must be 'approve' or 'reject'" });
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

    if (action === 'approve') {
      const upiId = claim.workers?.upi_id || claim.workerUpiId || 'worker@paytm';
      const payoutRes = await razorpayMock.dispatchUpiPayout({
        amount: claim.payout_amount || claim.payoutAmount,
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
            transaction_ref: transactionRef,
            reason: `Admin Resolved (Approved): ${reason || 'Evidence Overruled Risk Score'}`,
            resolved_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        claim = updated;
      } else {
        claim.claim_state = newState;
        claim.transaction_ref = transactionRef;
        claim.reason = `Admin Resolved (Approved): ${reason || 'Evidence Overruled Risk Score'}`;
        claim.resolved_at = new Date().toISOString();
      }

      return res.status(200).json({
        status: 'success',
        message: `Claim APPROVED by Admin! Razorpay UPI payout of ₹${claim.payout_amount || claim.payoutAmount} dispatched (Ref: ${transactionRef || 'N/A'}).`,
        claim
      });
    } else {
      const updatedReason = `Admin Resolved (Rejected): ${reason || 'Fraud Risk Model Confirmed'}`;

      if (process.env.SUPABASE_URL) {
        const { data: updated } = await supabase
          .from('claims')
          .update({ claim_state: 'Blocked', reason: updatedReason })
          .eq('id', id)
          .select()
          .single();
        claim = updated;
      } else {
        claim.claim_state = 'Blocked';
        claim.reason = updatedReason;
      }

      return res.status(200).json({ status: 'success', message: 'Claim REJECTED by Admin. State set to Blocked.', claim });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to resolve queued claim' });
  }
};

/**
 * @desc    Get all TriggerEvent audit logs
 * @route   GET /api/admin/triggers
 */
const getTriggerEvents = async (req, res) => {
  try {
    let triggers = [];

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('trigger_events')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw new Error(error.message);
      triggers = data || [];
    } else {
      triggers = disruptionMonitor.mockTriggerEventsStore;
    }

    return res.status(200).json({ status: 'success', count: triggers.length, triggers });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch trigger events' });
  }
};

/**
 * @desc    Get all FraudFlag audit logs
 * @route   GET /api/admin/fraud-flags
 */
const getFraudFlags = async (req, res) => {
  try {
    let flags = [];

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('fraud_flags')
        .select('*, claims(*)')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      flags = data || [];
    } else {
      flags = fraudEngine.mockFraudFlagsStore;
    }

    return res.status(200).json({ status: 'success', count: flags.length, flags });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch fraud flags' });
  }
};

/**
 * @desc    Get all pending claim appeals for Admin Review Queue
 * @route   GET /api/admin/appeals
 */
const getPendingAppeals = async (req, res) => {
  try {
    let appeals = [];

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('claims')
        .select('*, workers(*), trigger_events(*)')
        .eq('claim_state', 'Appealed')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      appeals = data || [];
    } else {
      appeals = mockClaimsStore.filter(c => (c.claim_state || c.claimState) === 'Appealed');
    }

    return res.status(200).json({ status: 'success', count: appeals.length, appeals });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch pending appeals' });
  }
};

/**
 * @desc    Review worker claim appeal
 * @route   POST /api/admin/appeals/:id/review
 */
const reviewClaimAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ status: 'fail', message: "Action must be 'approve' or 'reject'" });
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

    if (action === 'approve') {
      const upiId = claim.workers?.upi_id || claim.workerUpiId || 'worker@paytm';
      const payoutRes = await razorpayMock.dispatchUpiPayout({
        amount: claim.payout_amount || claim.payoutAmount,
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
            transaction_ref: transactionRef,
            reason: `Admin Approved Appeal: ${adminNote || 'Valid Disruption Claim Confirmed'}`,
            resolved_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        claim = updated;
      } else {
        claim.claim_state = newState;
        claim.transaction_ref = transactionRef;
        claim.reason = `Admin Approved Appeal: ${adminNote || 'Valid Disruption Claim Confirmed'}`;
        claim.resolved_at = new Date().toISOString();
      }

      return res.status(200).json({
        status: 'success',
        message: `Appeal APPROVED! Razorpay UPI payout of ₹${claim.payout_amount || claim.payoutAmount} dispatched (Ref: ${transactionRef || 'N/A'}).`,
        claim
      });
    } else {
      const updatedReason = `Admin Rejected Appeal: ${adminNote || 'Fraud Risk Model Upheld'}`;

      if (process.env.SUPABASE_URL) {
        const { data: updated } = await supabase
          .from('claims')
          .update({ claim_state: 'Blocked', reason: updatedReason })
          .eq('id', id)
          .select()
          .single();
        claim = updated;
      } else {
        claim.claim_state = 'Blocked';
        claim.reason = updatedReason;
      }

      return res.status(200).json({ status: 'success', message: 'Appeal REJECTED. Claim remains Blocked.', claim });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to review claim appeal' });
  }
};

module.exports = {
  getZones,
  createZone,
  updateZone,
  simulateDisruption,
  simulateFraudAttack,
  getAdminOverview,
  getForecast,
  getHeatmap,
  getFraudQueue,
  resolveQueuedClaim,
  getTriggerEvents,
  getFraudFlags,
  getPendingAppeals,
  reviewClaimAppeal
};
