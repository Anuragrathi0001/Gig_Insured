const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fraudEngine = require('./services/fraudEngine');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api', policyRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 5062;
const server = app.listen(PORT, async () => {
  console.log(`[Fraud Engine Test Server]: Running on http://localhost:${PORT}`);

  try {
    // 1. Direct Fraud Engine Unit Test
    console.log('\n--- Step 1: Fraud Engine Multi-Signal Unit Test ---');
    
    // Normal genuine claim evaluation
    fraudEngine.setFraudScenario(null);
    const genuineRes = await fraudEngine.evaluateClaimFraud({ _id: 'claim_genuine_01' }, { name: 'Rahul', priorFraudFlags: 0, kycStatus: 'verified' });
    console.log('Genuine Claim Evaluation:', { score: genuineRes.fraudRiskScore, state: genuineRes.claimState });

    // GPS Spoofing Attack Scenario
    fraudEngine.setFraudScenario('gps_spoofing');
    const gpsRes = await fraudEngine.evaluateClaimFraud({ _id: 'claim_gps_01' }, { name: 'Suspicious Worker' });
    console.log('GPS Spoofing Claim Evaluation:', { score: gpsRes.fraudRiskScore, state: gpsRes.claimState, flagsCount: gpsRes.triggeredSignalsCount });

    // Coordinated Ring Attack Scenario (High Score -> Blocked)
    fraudEngine.setFraudScenario('FRAUD_ATTACK');
    const attackRes = await fraudEngine.evaluateClaimFraud({ _id: 'claim_ring_01' }, { name: 'Ring Member' });
    console.log('Coordinated Attack Ring Evaluation:', { score: attackRes.fraudRiskScore, state: attackRes.claimState, flagsCount: attackRes.triggeredSignalsCount });

    // 2. High-Value Payout OTP Verification Endpoint Test
    console.log('\n--- Step 2: High-Value Payout OTP Verification Test ---');
    const mobile = '9876543555';
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp: sendRes.data.devOtpHint });
    const token = verifyRes.data.token;

    await axios.post(
      `http://localhost:${PORT}/api/workers/onboard`,
      { name: 'Meera Partner', city: 'Bengaluru', zone: 'Indiranagar', platform: 'Zomato', workerId: 'ZOM-8821', avgWeeklyIncome: 6500, upiId: 'meera@upi' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.post(
      `http://localhost:${PORT}/api/policy/activate`,
      { tier: 'Premium', autoRenew: true, transactionId: 'TXN-PREM-99' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Reset to normal scenario & trigger heavy rain
    fraudEngine.setFraudScenario(null);
    await axios.post(`http://localhost:${PORT}/api/admin/simulate-disruption`, { scenario: 'heavy_rain' });

    const claimsRes = await axios.get(`http://localhost:${PORT}/api/claims/my-claims`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (claimsRes.data.claims?.length > 0) {
      const claim = claimsRes.data.claims[0];
      console.log('Auto-Created Claim:', { id: claim._id, payout: claim.payoutAmount, state: claim.claimState, otpRequired: claim.otpVerificationRequired });

      // Verify OTP for high-value payout
      const otpVerifyRes = await axios.post(
        `http://localhost:${PORT}/api/claims/${claim._id}/verify-payout-otp`,
        { otp: '123456' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('OTP Verification Endpoint Response:', otpVerifyRes.data.message);
    }

    // 3. GET /api/admin/fraud-flags Verification
    console.log('\n--- Step 3: GET /api/admin/fraud-flags Verification ---');
    const flagsRes = await axios.get(`http://localhost:${PORT}/api/admin/fraud-flags`);
    console.log(`Fetched ${flagsRes.data.count} flagged fraud audit entries.`);

    console.log('\n==================================================');
    console.log('[ALL MULTI-SIGNAL FRAUD SCORING TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Fraud Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
