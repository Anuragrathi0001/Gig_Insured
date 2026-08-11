const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = 5056;
const server = app.listen(PORT, async () => {
  console.log(`[Auth Test Server]: Running on http://localhost:${PORT}`);

  try {
    const mobile = '9876543211';

    // 1. Send OTP
    console.log('\n--- Test 1: POST /api/auth/send-otp ---');
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    console.log('Send OTP Response:', sendRes.data);
    const otp = sendRes.data.devOtpHint;

    // 2. Verify Valid OTP & JWT Generation
    console.log('\n--- Test 2: Valid OTP & Worker Creation ---');
    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp });
    console.log('Verify OTP Response:', {
      status: verifyRes.data.status,
      isNewWorker: verifyRes.data.isNewWorker,
      workerId: verifyRes.data.worker.workerId,
      tokenLength: verifyRes.data.token.length
    });
    const token = verifyRes.data.token;

    // 3. Test Protected /api/auth/me endpoint
    console.log('\n--- Test 3: Protected GET /api/auth/me ---');
    const meRes = await axios.get(`http://localhost:${PORT}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Protected Route Profile Response:', {
      status: meRes.data.status,
      workerId: meRes.data.worker.workerId,
      mobile: meRes.data.worker.mobile
    });

    console.log('\n==================================================');
    console.log('[ALL AUTH TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Auth Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
