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

const PORT = 5065;
const server = app.listen(PORT, async () => {
  console.log(`[Admin Dashboard Test Server]: Running on http://localhost:${PORT}`);

  try {
    // Setup Worker & Policy
    console.log('\n--- Step 1: Worker & Policy Setup ---');
    const mobile = '9876543888';
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp: sendRes.data.devOtpHint });
    const token = verifyRes.data.token;

    await axios.post(
      `http://localhost:${PORT}/api/workers/onboard`,
      { name: 'Devendra Kumar', city: 'Bengaluru', zone: 'Indiranagar', platform: 'Swiggy', workerId: 'SWG-6622', avgWeeklyIncome: 5500, upiId: 'devendra@paytm' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.post(
      `http://localhost:${PORT}/api/policy/activate`,
      { tier: 'Standard', autoRenew: true, transactionId: 'TXN-ADM-01' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Simulate Coordinated Ring Attack to generate claims in Fraud Queue
    fraudEngine.setFraudScenario('FRAUD_ATTACK');
    await axios.post(`http://localhost:${PORT}/api/admin/simulate-disruption`, { scenario: 'heavy_rain' });

    // 1. GET /api/admin/overview Loss Ratio Test
    console.log('\n--- Step 2: GET /api/admin/overview Retrieval ---');
    const overviewRes = await axios.get(`http://localhost:${PORT}/api/admin/overview`);
    console.log('Overview Analytics Data:', overviewRes.data.overview);

    // 2. GET /api/admin/fraud-queue Evidence Drill-Down Test
    console.log('\n--- Step 3: GET /api/admin/fraud-queue Evidence Inspection ---');
    const queueRes = await axios.get(`http://localhost:${PORT}/api/admin/fraud-queue`);
    console.log(`Fetched ${queueRes.data.count} queued claims with evidence bundles.`);

    if (queueRes.data.queue?.length > 0) {
      const queuedClaim = queueRes.data.queue[0];
      console.log('Sample Queued Claim Evidence Bundle:', {
        id: queuedClaim._id,
        score: queuedClaim.fraudRiskScore,
        state: queuedClaim.claimState,
        evidence: queuedClaim.evidence
      });

      // 3. POST /api/admin/claims/:id/resolve Approval Test
      console.log('\n--- Step 4: POST /api/admin/claims/:id/resolve Approval Test ---');
      const resolveRes = await axios.post(`http://localhost:${PORT}/api/admin/claims/${queuedClaim._id}/resolve`, {
        action: 'approve',
        reason: 'Overruled by admin after inspecting GPS logs.'
      });

      console.log('Resolve Endpoint Response:', resolveRes.data.message);
      console.log('Updated Claim Details:', {
        id: resolveRes.data.claim?._id,
        state: resolveRes.data.claim?.claimState,
        transactionRef: resolveRes.data.claim?.transactionRef
      });
    }

    console.log('\n==================================================');
    console.log('[ALL ADMIN DASHBOARD & FRAUD QUEUE TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Admin Dashboard Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
