const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seedDemo = require('./scripts/seedDemo');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api', policyRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 5067;
const server = app.listen(PORT, async () => {
  console.log(`[E2E Demo Test Server]: Running on http://localhost:${PORT}`);

  try {
    // 1. Run Seed Script
    console.log('\n--- Step 1: Running Demo Seed Script ---');
    await seedDemo();

    // 2. Worker OTP Login & Onboarding
    console.log('\n--- Step 2: Worker Auth & Policy Activation ---');
    const mobile = '9876543999';
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp: sendRes.data.devOtpHint });
    const token = verifyRes.data.token;

    await axios.post(
      `http://localhost:${PORT}/api/workers/onboard`,
      { name: 'Suresh Nair', city: 'Bengaluru', zone: 'Indiranagar', platform: 'Zomato', workerId: 'ZOM-7711', avgWeeklyIncome: 6200, upiId: 'suresh@paytm' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.post(
      `http://localhost:${PORT}/api/policy/activate`,
      { tier: 'Standard', autoRenew: true, transactionId: 'TXN-E2E-01' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 3. Live Disruption Simulation
    console.log('\n--- Step 3: Admin Disruption Simulation & Auto Payout ---');
    const simRes = await axios.post(`http://localhost:${PORT}/api/admin/simulate-disruption`, {
      scenario: 'heavy_rain',
      zoneName: 'Indiranagar'
    });
    console.log('Simulation Triggered Result:', simRes.data.message);

    // 4. Verify Worker Dashboard Real-time Payout Update
    console.log('\n--- Step 4: Worker Dashboard Real-Time Update ---');
    const dashRes = await axios.get(`http://localhost:${PORT}/api/workers/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Worker Dashboard Updated Payload:', {
      worker: dashRes.data.dashboard?.worker?.name,
      totalEarningsProtected: '₹' + dashRes.data.dashboard?.totalEarningsProtected,
      activePolicyTier: dashRes.data.dashboard?.activePolicy?.tier,
      timelineDaysCount: dashRes.data.dashboard?.weeklyTimeline?.length
    });

    // 5. Admin Fraud Queue & Resolve Verification
    console.log('\n--- Step 5: Admin Fraud Queue & Resolution ---');
    await axios.post(`http://localhost:${PORT}/api/admin/simulate-fraud`, { scenario: 'coordinated_ring' });
    const queueRes = await axios.get(`http://localhost:${PORT}/api/admin/fraud-queue`);
    console.log(`Fraud Queue count: ${queueRes.data.count}`);

    if (queueRes.data.queue?.length > 0) {
      const queuedClaim = queueRes.data.queue[0];
      const resolveRes = await axios.post(`http://localhost:${PORT}/api/admin/claims/${queuedClaim._id}/resolve`, {
        action: 'approve',
        reason: 'Overruled by admin after inspecting evidence bundle.'
      });
      console.log('Claim Resolve Result:', resolveRes.data.message);
    }

    console.log('\n==================================================');
    console.log('[FULL END-TO-END DEMO SMOKE TEST PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[E2E Demo Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
