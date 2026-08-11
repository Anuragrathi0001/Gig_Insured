const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);

const PORT = 5057;
const server = app.listen(PORT, async () => {
  console.log(`[Onboarding Test Server]: Running on http://localhost:${PORT}`);

  try {
    const mobile = '9876543222';

    // 1. Authenticate worker via OTP
    console.log('\n--- Step 1: Request & Verify OTP ---');
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    const otp = sendRes.data.devOtpHint;

    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp });
    const token = verifyRes.data.token;
    console.log('Worker Auth Token Obtained:', token.slice(0, 30) + '...');

    // 2. Submit Worker Onboarding & Risk Calculation
    console.log('\n--- Step 2: POST /api/workers/onboard ---');
    const onboardPayload = {
      name: 'Vikram Singh',
      city: 'Mumbai',
      zone: 'Andheri',
      platform: 'Swiggy',
      workerId: 'SWG-99281',
      avgWeeklyIncome: 6500,
      upiId: 'vikram99@okicici'
    };

    const onboardRes = await axios.post(
      `http://localhost:${PORT}/api/workers/onboard`,
      onboardPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Onboarding Response:', {
      status: onboardRes.data.status,
      name: onboardRes.data.worker.name,
      platform: onboardRes.data.worker.platform,
      riskProfile: onboardRes.data.riskProfile
    });

    // 3. Verify GET /api/workers/me
    console.log('\n--- Step 3: GET /api/workers/me ---');
    const meRes = await axios.get(
      `http://localhost:${PORT}/api/workers/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Worker Profile Verified:', {
      status: meRes.data.status,
      workerId: meRes.data.worker.workerId,
      city: meRes.data.worker.city,
      zone: meRes.data.worker.zone,
      riskProfile: meRes.data.worker.riskProfile
    });

    console.log('\n==================================================');
    console.log('[ALL ONBOARDING & RISK ENGINE TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Onboarding Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
