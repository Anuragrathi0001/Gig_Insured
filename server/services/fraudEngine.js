const mongoose = require('mongoose');
const { FraudFlag } = require('../models');

// In-memory mock fraud flag store for offline DB fallback
const mockFraudFlagsStore = [];

// Global active simulation scenario for fraud testing
let activeFraudScenario = null;

const setFraudScenario = (scenario) => {
  activeFraudScenario = scenario;
  console.log(`[FraudEngine]: Active fraud scenario set to -> ${scenario || 'GENUINE_CLAIM'}`);
};

/**
 * Evaluate Claim against 4 Multi-Signal Risk Categories & Apply Decision Matrix
 */
const evaluateClaimFraud = async (claim, worker = {}, triggerEvent = {}) => {
  let score = 0;
  const triggeredSignals = [];

  const isGpsSpoofed = activeFraudScenario === 'gps_spoofing' || activeFraudScenario === 'FRAUD_ATTACK';
  const isBehavioralFake = activeFraudScenario === 'fake_weather' || activeFraudScenario === 'FRAUD_ATTACK';
  const isCoordinatedRing = activeFraudScenario === 'coordinated_ring' || activeFraudScenario === 'FRAUD_ATTACK';
  const isSuspiciousIp = activeFraudScenario === 'suspicious_ip';

  // 1. GPS Signal Check (location static or movement speed > 120km/h)
  if (isGpsSpoofed) {
    score += 25;
    triggeredSignals.push({
      signalType: 'gps-spoofing',
      details: {
        reason: 'Static GPS location fix inside zone with zero accelerometer motion during active disruption',
        detectedSpeedKmph: 0,
        altitudeVariance: 0
      },
      severity: 'high'
    });
  }

  // 2. Behavioral Signal Check (completing orders in same zone during severe weather)
  if (isBehavioralFake) {
    score += 30;
    triggeredSignals.push({
      signalType: 'fake-weather',
      details: {
        reason: 'Worker completed 3 Zomato orders in same zone during active torrential downpour window',
        completedOrdersInWindow: 3
      },
      severity: 'high'
    });
  }

  // 3. Device/Network Signal Check (duplicate device ID / IP subnet cluster)
  if (isSuspiciousIp) {
    score += 20;
    triggeredSignals.push({
      signalType: 'duplicate',
      details: {
        reason: 'Identical Android Device Fingerprint ID detected across 3 distinct worker accounts',
        deviceId: 'DEV-FINGERPRINT-8891'
      },
      severity: 'medium'
    });
  }

  // 4. Graph Signal Check (coordinated ring >5 workers filing within 10m window)
  if (isCoordinatedRing) {
    score += 35;
    triggeredSignals.push({
      signalType: 'coordinated-ring',
      details: {
        reason: 'Coordinated attack ring: 7 claims submitted within 4-minute window from shared IP subnet',
        clusterSize: 7,
        timeWindowMins: 4
      },
      severity: 'critical'
    });
  }

  // Baseline random noise (0 - 10) for normal claims
  if (score === 0) {
    score = Math.floor(Math.random() * 10);
  }

  // Genuine-User Grace Threshold:
  // Workers with <2 prior fraud flags and verified KYC / >6 weeks tenure get benefit of doubt if score is 31-50
  const priorFlagsCount = worker.priorFraudFlags || 0;
  const isTrustedWorker = priorFlagsCount < 2 && (worker.kycStatus === 'verified' || (worker.tenureWeeks || 8) > 6);
  let graceThresholdApplied = false;

  if (score >= 31 && score <= 50 && isTrustedWorker) {
    graceThresholdApplied = true;
    score = 25; // Reduce score to Auto-Approved tier
    console.log(`[FraudEngine GRACE]: Trusted worker (${worker.name || worker.mobile}) score reduced from 31-50 range down to 25 (Auto-Approved).`);
  }

  score = Math.min(Math.max(score, 0), 100);

  // Decision Engine Matrix
  let claimState = 'Auto-Approved';
  if (score >= 71) {
    claimState = 'Blocked';
  } else if (score >= 31) {
    claimState = 'Under-Review';
  }

  // Save FraudFlag documents for triggered signals
  const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;
  const createdFlags = [];

  for (const sig of triggeredSignals) {
    const flagPayload = {
      claimId: claim._id || claim.id,
      signalType: sig.signalType,
      details: sig.details,
      severity: sig.severity
    };

    if (isDbConnected) {
      const flagDoc = await FraudFlag.create(flagPayload);
      createdFlags.push(flagDoc);
    } else {
      const mockFlag = {
        _id: `flag_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        ...flagPayload,
        createdAt: new Date().toISOString()
      };
      mockFraudFlagsStore.unshift(mockFlag);
      createdFlags.push(mockFlag);
    }
  }

  console.log(`[FraudEngine EVALUATION]: Claim=${claim._id || claim.id} | Score=${score} | Decision=${claimState} | Flags=${createdFlags.length} | GraceApplied=${graceThresholdApplied}`);

  return {
    fraudRiskScore: score,
    claimState,
    graceThresholdApplied,
    triggeredSignalsCount: createdFlags.length,
    flags: createdFlags
  };
};

module.exports = {
  evaluateClaimFraud,
  setFraudScenario,
  mockFraudFlagsStore
};
