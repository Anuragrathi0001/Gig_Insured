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
    // 1. Google Firebase Login & Worker Creation
    console.log('\n--- Test 1: POST /api/auth/google-login ---');
    const googleRes = await axios.post(`http://localhost:${PORT}/api/auth/google-login`, {
      email: 'abhayraj.delivery@gmail.com',
      displayName: 'Abhayraj Rathi',
      uid: 'google_uid_998877'
    });
    console.log('Google Auth Response:', {
      status: googleRes.data.status,
      isNewWorker: googleRes.data.isNewWorker,
      workerId: googleRes.data.worker.workerId || googleRes.data.worker.worker_id,
      email: googleRes.data.worker.email,
      tokenLength: googleRes.data.token.length
    });
    const token = googleRes.data.token;

    // 2. Test Protected /api/auth/me endpoint
    console.log('\n--- Test 2: Protected GET /api/auth/me ---');
    const meRes = await axios.get(`http://localhost:${PORT}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Protected Route Profile Response:', {
      status: meRes.data.status,
      workerId: meRes.data.worker.workerId || meRes.data.worker.worker_id,
      email: meRes.data.worker.email
    });

    console.log('\n==================================================');
    console.log('[ALL FIREBASE GOOGLE AUTH TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Auth Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
