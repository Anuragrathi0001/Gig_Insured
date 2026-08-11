const mongoose = require('mongoose');
const { ZoneConfig, TriggerEvent, FraudFlag, Claim, Policy, Worker } = require('../models');
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
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let zones = [];

    if (isDbConnected) {
      zones = await ZoneConfig.find({}).lean();
    } else {
      zones = zoneData.getActiveZones();
    }

    const zonesWithWeather = await Promise.all(
      zones.map(async (z) => {
        const weather = await weatherService.getZoneWeather(z.zoneName);
        return {
          ...z,
          liveWeather: weather
        };
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

    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let newZone;

    if (isDbConnected) {
      newZone = await ZoneConfig.create({
        zoneName: zoneName.trim(),
        city: city.trim(),
        geoBoundary: geoBoundary || {
          type: 'Polygon',
          coordinates: [[[77.6, 12.9], [77.7, 12.9], [77.7, 13.0], [77.6, 13.0], [77.6, 12.9]]]
        },
        triggerThresholds: triggerThresholds || { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300 },
        premiumBand: premiumBand || { Basic: 25, Standard: 45, Premium: 75 }
      });
    } else {
      newZone = {
        _id: `zone_${Date.now()}`,
        zoneName: zoneName.trim(),
        city: city.trim(),
        geoBoundary: geoBoundary || {
          type: 'Polygon',
          coordinates: [[[77.6, 12.9], [77.7, 12.9], [77.7, 13.0], [77.6, 13.0], [77.6, 12.9]]]
        },
        triggerThresholds: triggerThresholds || { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300 },
        premiumBand: premiumBand || { Basic: 25, Standard: 45, Premium: 75 }
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

    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let updatedZone = null;

    if (isDbConnected) {
      updatedZone = await ZoneConfig.findByIdAndUpdate(
        id,
        {
          ...(triggerThresholds && { triggerThresholds }),
          ...(premiumBand && { premiumBand })
        },
        { new: true }
      );
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
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let claims = [];
    let policies = [];

    if (isDbConnected) {
      claims = await Claim.find({}).lean();
      policies = await Policy.find({ status: 'Active' }).lean();
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

    const totalPremiumsCollected = policies.reduce((sum, p) => sum + (p.weeklyPremium || 50), 0) || 2100;
    const paidClaims = claims.filter(c => c.claimState === 'Paid');
    const totalPayoutsDisbursed = paidClaims.reduce((sum, c) => sum + (c.payoutAmount || 0), 0);

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
      autoApproved: claims.filter(c => c.claimState === 'Auto-Approved' || c.claimState === 'Paid').length,
      underReview: claims.filter(c => c.claimState === 'Under-Review').length,
      blocked: claims.filter(c => c.claimState === 'Blocked').length,
      appealed: claims.filter(c => c.claimState === 'Appealed').length
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
    return res.status(200).json({
      status: 'success',
      count: forecast.length,
      forecast
    });
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
    return res.status(200).json({
      status: 'success',
      count: heatmap.length,
      heatmap
    });
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
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let queuedClaims = [];

    if (isDbConnected) {
      queuedClaims = await Claim.find({
        fraudRiskScore: { $gte: 31 },
        claimState: { $in: ['Under-Review', 'Blocked', 'Scoring'] }
      })
        .populate('workerId')
        .sort({ fraudRiskScore: -1 })
        .lean();
    } else {
      queuedClaims = mockClaimsStore.filter(c =>
        (c.fraudRiskScore || 0) >= 31 || c.claimState === 'Under-Review' || c.claimState === 'Blocked'
      );
    }

    const queuedClaimsWithEvidence = queuedClaims.map(c => ({
      ...c,
      evidence: {
        gpsEvidence: {
          status: c.fraudRiskScore >= 25 ? 'STATIC_FIX_FLAGGED' : 'NORMAL_MOTION',
          detectedSpeedKmph: c.fraudRiskScore >= 25 ? 0 : 28,
          staticDurationMins: 45,
          locationFix: 'Indiranagar Hub Geo-Polygon'
        },
        platformEvidence: {
          status: c.fraudRiskScore >= 30 ? 'ACTIVE_DELIVERIES_DURING_DISRUPTION' : 'IDLE_DURING_DISRUPTION',
          ordersCompletedInWindow: c.fraudRiskScore >= 30 ? 3 : 0,
          platformName: 'Zomato / Swiggy Partner API'
        },
        deviceEvidence: {
          fingerprintId: 'DEV-FINGERPRINT-8891',
          isDuplicateDevice: c.fraudRiskScore >= 20,
          associatedWorkerAccounts: c.fraudRiskScore >= 20 ? 3 : 1
        },
        networkEvidence: {
          subnetIp: '192.168.1.104',
          isClusterAttacked: c.fraudRiskScore >= 35,
          clusterClaimsCount: c.fraudRiskScore >= 35 ? 7 : 1
        }
      }
    }));

    return res.status(200).json({
      status: 'success',
      count: queuedClaimsWithEvidence.length,
      queue: queuedClaimsWithEvidence
    });
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

    if (action === 'approve') {
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
        claim.transactionRef = transactionRef;
        claim.reason = `Admin Resolved (Approved): ${reason || 'Evidence Overruled Risk Score'}`;
        claim.resolvedAt = new Date();
        await claim.save();
      } else {
        claim.claimState = newState;
        claim.transactionRef = transactionRef;
        claim.reason = `Admin Resolved (Approved): ${reason || 'Evidence Overruled Risk Score'}`;
        claim.resolvedAt = new Date().toISOString();
      }

      return res.status(200).json({
        status: 'success',
        message: `Claim APPROVED by Admin! Razorpay UPI payout of ₹${claim.payoutAmount} dispatched (Ref: ${transactionRef || 'N/A'}).`,
        claim
      });
    } else {
      const updatedReason = `Admin Resolved (Rejected): ${reason || 'Fraud Risk Model Confirmed'}`;
      if (isDbConnected) {
        claim.claimState = 'Blocked';
        claim.reason = updatedReason;
        await claim.save();
      } else {
        claim.claimState = 'Blocked';
        claim.reason = updatedReason;
      }

      return res.status(200).json({
        status: 'success',
        message: 'Claim REJECTED by Admin. State set to Blocked.',
        claim
      });
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
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let triggers = [];

    if (isDbConnected) {
      triggers = await TriggerEvent.find({}).sort({ timestamp: -1 }).lean();
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
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let flags = [];

    if (isDbConnected) {
      flags = await FraudFlag.find({}).populate('claimId').sort({ createdAt: -1 }).lean();
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
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    let appeals = [];

    if (isDbConnected) {
      appeals = await Claim.find({ claimState: 'Appealed' })
        .populate('workerId')
        .populate('triggerEventId')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      appeals = mockClaimsStore.filter(c => c.claimState === 'Appealed');
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

    if (action === 'approve') {
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
        claim.transactionRef = transactionRef;
        claim.reason = `Admin Approved Appeal: ${adminNote || 'Valid Disruption Claim Confirmed'}`;
        claim.resolvedAt = new Date();
        await claim.save();
      } else {
        claim.claimState = newState;
        claim.transactionRef = transactionRef;
        claim.reason = `Admin Approved Appeal: ${adminNote || 'Valid Disruption Claim Confirmed'}`;
        claim.resolvedAt = new Date().toISOString();
      }

      return res.status(200).json({
        status: 'success',
        message: `Appeal APPROVED! Razorpay UPI payout of ₹${claim.payoutAmount} dispatched (Ref: ${transactionRef || 'N/A'}).`,
        claim
      });
    } else {
      const updatedReason = `Admin Rejected Appeal: ${adminNote || 'Fraud Risk Model Upheld'}`;
      if (isDbConnected) {
        claim.claimState = 'Blocked';
        claim.reason = updatedReason;
        await claim.save();
      } else {
        claim.claimState = 'Blocked';
        claim.reason = updatedReason;
      }

      return res.status(200).json({
        status: 'success',
        message: 'Appeal REJECTED. Claim remains Blocked.',
        claim
      });
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
