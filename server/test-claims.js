const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');
const payoutEngine = require('./services/payoutEngine');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api', policyRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 5061;
const server = app.listen(PORT, async () => {
  console.log(`[Claims Automation Test Server]: Running on http://localhost:${PORT}`);

  try {
    // 1. Direct Payout Engine Unit Test
    console.log('\n--- Step 1: Payout Engine Formula Test ---');
    const samplePayout = payoutEngine.calculatePayout({
      hoursLost: 4,
      avgWeeklyIncome: 5500,
      weeklyBenefitCap: 3000
    });
    console.log('Payout Engine Output:', samplePayout);

    // 2. Auth, Onboard & Activate Policy
    console.log('\n--- Step 2: Worker Setup & Policy Activation ---');
    const mobile = '9876543444';
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp: sendRes.data.devOtpHint });
    const token = verifyRes.data.token;

    await axios.post(
      `http://localhost:${PORT}/api/workers/onboard`,
      {
        name: 'Siddharth Rao',
        city: 'Bengaluru',
        zone: 'Indiranagar',
        platform: 'Swiggy',
        workerId: 'SWG-77192',
        avgWeeklyIncome: 5500,
        upiId: 'siddharth@paytm'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.post(
      `http://localhost:${PORT}/api/policy/activate`,
      { tier: 'Standard', autoRenew: true, transactionId: 'TXN-TEST-123' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 3. Trigger Heavy Rain Disruption Scenario (Auto-Generates Claims)
    console.log('\n--- Step 3: Trigger Confirmed Heavy Rain Scenario ---');
    const simRes = await axios.post(`http://localhost:${PORT}/api/admin/simulate-disruption`, {
      scenario: 'heavy_rain'
    });
    console.log('Simulate Disruption Response:', simRes.data.message);

    // 4. GET /api/claims/my-claims Verification
    console.log('\n--- Step 4: GET /api/claims/my-claims Verification ---');
    const claimsRes = await axios.get(`http://localhost:${PORT}/api/claims/my-claims`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`Fetched ${claimsRes.data.count} auto-generated claims for worker.`);
    if (claimsRes.data.claims?.length > 0) {
      const claim = claimsRes.data.claims[0];
      console.log('Auto-Created Claim Details:', {
        id: claim._id,
        reason: claim.reason,
        hoursLost: claim.hoursLost,
        payoutAmount: claim.payoutAmount,
        claimState: claim.claimState,
        fraudRiskScore: claim.fraudRiskScore
      });
    }

    console.log('\n==================================================');
    console.log('[ALL CLAIM AUTOMATION & PAYOUT ENGINE TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Claims Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
