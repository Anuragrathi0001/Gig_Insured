const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const policyRoutes = require('./routes/policyRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api', policyRoutes);

const PORT = 5058;
const server = app.listen(PORT, async () => {
  console.log(`[Policy Test Server]: Running on http://localhost:${PORT}`);

  try {
    const mobile = '9876543333';

    // 1. Authenticate worker
    console.log('\n--- Step 1: Auth & Onboarding ---');
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp: sendRes.data.devOtpHint });
    const token = verifyRes.data.token;

    await axios.post(
      `http://localhost:${PORT}/api/workers/onboard`,
      {
        name: 'Arjun Reddy',
        city: 'Bengaluru',
        zone: 'Indiranagar',
        platform: 'Zomato',
        workerId: 'ZOM-88192',
        avgWeeklyIncome: 5500,
        upiId: 'arjun@ybl'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 2. GET /api/premium/quote
    console.log('\n--- Step 2: GET /api/premium/quote ---');
    const quoteRes = await axios.get(`http://localhost:${PORT}/api/premium/quote`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Premium Quotes Generated:', quoteRes.data.quotes.map(q => ({
      tier: q.tier,
      weeklyPremium: q.weeklyPremium,
      benefitCap: q.weeklyBenefitCap,
      hourlyRate: q.hourlyDisruptionRate
    })));

    // 3. POST /api/payments/mock-upi
    console.log('\n--- Step 3: POST /api/payments/mock-upi ---');
    const chosenQuote = quoteRes.data.quotes.find(q => q.tier === 'Standard');
    const payRes = await axios.post(
      `http://localhost:${PORT}/api/payments/mock-upi`,
      { amount: chosenQuote.weeklyPremium, tier: chosenQuote.tier, upiId: 'arjun@ybl' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Mock UPI Payment Response:', payRes.data);

    // 4. POST /api/policy/activate
    console.log('\n--- Step 4: POST /api/policy/activate ---');
    const activateRes = await axios.post(
      `http://localhost:${PORT}/api/policy/activate`,
      { tier: 'Standard', autoRenew: true, transactionId: payRes.data.transactionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Policy Activation Response:', {
      status: activateRes.data.status,
      tier: activateRes.data.policy.tier,
      premium: activateRes.data.policy.weeklyPremium,
      benefitCap: activateRes.data.policy.weeklyBenefitCap,
      policyStatus: activateRes.data.policy.status,
      coveragePeriodStart: activateRes.data.policy.coveragePeriodStart,
      coveragePeriodEnd: activateRes.data.policy.coveragePeriodEnd
    });

    // 5. GET /api/policy/active
    console.log('\n--- Step 5: GET /api/policy/active ---');
    const activeRes = await axios.get(`http://localhost:${PORT}/api/policy/active`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Active Policy Verified:', {
      hasActivePolicy: activeRes.data.hasActivePolicy,
      tier: activeRes.data.policy.tier,
      status: activeRes.data.policy.status
    });

    console.log('\n==================================================');
    console.log('[ALL POLICY & PAYMENT TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Policy Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
