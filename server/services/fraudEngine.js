const supabase = require('../config/supabase');

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

  // 1. GPS Signal Check
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

  // 2. Behavioral Signal Check
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

  // 3. Device/Network Signal Check
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

  // 4. Graph Signal Check
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

  // Baseline random noise (0-10) for normal claims
  if (score === 0) {
    score = Math.floor(Math.random() * 10);
  }

  // Grace Threshold: trusted workers with low prior flags get benefit of doubt (score 31-50)
  const priorFlagsCount = worker.priorFraudFlags || 0;
  const isTrustedWorker = priorFlagsCount < 2 && (worker.kyc_status === 'verified' || worker.kycStatus === 'verified' || (worker.tenureWeeks || 8) > 6);
  let graceThresholdApplied = false;

  if (score >= 31 && score <= 50 && isTrustedWorker) {
    graceThresholdApplied = true;
    score = 25;
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
  const createdFlags = [];
  const claimId = claim.id || claim._id;

  for (const sig of triggeredSignals) {
    const flagPayload = {
      claim_id: claimId,
      signal_type: sig.signalType,
      details: sig.details,
      severity: sig.severity
    };

    if (process.env.SUPABASE_URL && claimId && !String(claimId).startsWith('claim_')) {
      // Only persist to DB if claimId is a valid UUID (not a mock ID)
      const { data: flagDoc, error } = await supabase
        .from('fraud_flags')
        .insert(flagPayload)
        .select()
        .single();

      if (!error && flagDoc) {
        createdFlags.push(flagDoc);
      } else {
        // Fall through to in-memory store if insert fails (e.g., during pre-insert evaluation)
        const mockFlag = {
          id: `flag_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          ...flagPayload,
          created_at: new Date().toISOString()
        };
        mockFraudFlagsStore.unshift(mockFlag);
        createdFlags.push(mockFlag);
      }
    } else {
      const mockFlag = {
        id: `flag_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        ...flagPayload,
        created_at: new Date().toISOString()
      };
      mockFraudFlagsStore.unshift(mockFlag);
      createdFlags.push(mockFlag);
    }
  }

  console.log(`[FraudEngine EVALUATION]: Claim=${claimId} | Score=${score} | Decision=${claimState} | Flags=${createdFlags.length} | GraceApplied=${graceThresholdApplied}`);

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
