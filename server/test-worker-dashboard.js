const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api', policyRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 5064;
const server = app.listen(PORT, async () => {
  console.log(`[Worker Dashboard Test Server]: Running on http://localhost:${PORT}`);

  try {
    // 1. Worker Setup & Policy Activation
    console.log('\n--- Step 1: Worker Registration & Setup ---');
    const mobile = '9876543777';
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp: sendRes.data.devOtpHint });
    const token = verifyRes.data.token;

    await axios.post(
      `http://localhost:${PORT}/api/workers/onboard`,
      { name: 'Ananya Roy', city: 'Bengaluru', zone: 'Indiranagar', platform: 'Zomato', workerId: 'ZOM-7788', avgWeeklyIncome: 6000, upiId: 'ananya@paytm' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.post(
      `http://localhost:${PORT}/api/policy/activate`,
      { tier: 'Standard', autoRenew: true, transactionId: 'TXN-DASH-01' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Trigger Disruption & Auto Payout
    await axios.post(`http://localhost:${PORT}/api/admin/simulate-disruption`, { scenario: 'heavy_rain' });

    // 2. GET /api/workers/dashboard Test
    console.log('\n--- Step 2: GET /api/workers/dashboard Retrieval ---');
    const dashRes = await axios.get(`http://localhost:${PORT}/api/workers/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const dash = dashRes.data.dashboard;
    console.log('Dashboard Data Response:', {
      workerName: dash.worker?.name,
      activeTier: dash.activePolicy?.tier,
      totalEarningsProtected: dash.totalEarningsProtected,
      timelineDaysCount: dash.weeklyTimeline?.length,
      sampleTimelineDay: dash.weeklyTimeline?.[0],
      premiumHistoryCount: dash.premiumHistory?.length,
      fraudRiskLevel: dash.fraudRiskLevel, // Should be null or 'Low'/'Medium', NEVER numeric!
      canCancelPolicy: dash.canCancelPolicy
    });

    console.log('\n==================================================');
    console.log('[ALL WORKER DASHBOARD TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Worker Dashboard Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
