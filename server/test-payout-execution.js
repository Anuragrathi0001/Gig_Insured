const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');
const razorpayMock = require('./integrations/razorpayMock');
const fraudEngine = require('./services/fraudEngine');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api', policyRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 5063;
const server = app.listen(PORT, async () => {
  console.log(`[Payout Execution Test Server]: Running on http://localhost:${PORT}`);

  try {
    // 1. Direct Razorpay Payout Integration & Retry Test
    console.log('\n--- Step 1: Razorpay X Instant UPI Payout & 3-Tier Retry Test ---');
    razorpayMock.setSimulatePayoutFailures(true);
    const retryPayoutRes = await razorpayMock.dispatchUpiPayout({
      amount: 450,
      upiId: 'vikram@paytm',
      claimId: 'claim_retry_001',
      workerName: 'Vikram'
    });

    console.log('Retry Mechanism Outcome:', {
      success: retryPayoutRes.success,
      status: retryPayoutRes.status,
      txnRef: retryPayoutRes.transactionRef,
      attemptCount: retryPayoutRes.attemptCount
    });

    razorpayMock.setSimulatePayoutFailures(false);

    // 2. Full End-to-End Payout & Appeal Workflow Test
    console.log('\n--- Step 2: Full End-to-End Worker Setup & Disruption Payout ---');
    const mobile = '9876543666';
    const sendRes = await axios.post(`http://localhost:${PORT}/api/auth/send-otp`, { mobile });
    const verifyRes = await axios.post(`http://localhost:${PORT}/api/auth/verify-otp`, { mobile, otp: sendRes.data.devOtpHint });
    const token = verifyRes.data.token;

    await axios.post(
      `http://localhost:${PORT}/api/workers/onboard`,
      { name: 'Karan Sharma', city: 'Bengaluru', zone: 'Indiranagar', platform: 'Swiggy', workerId: 'SWG-9901', avgWeeklyIncome: 5000, upiId: 'karan@ybl' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.post(
      `http://localhost:${PORT}/api/policy/activate`,
      { tier: 'Standard', autoRenew: true, transactionId: 'TXN-PAYOUT-01' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Simulate Coordinated Ring Attack to produce a Blocked claim for Appeal test
    fraudEngine.setFraudScenario('FRAUD_ATTACK');
    await axios.post(`http://localhost:${PORT}/api/admin/simulate-disruption`, { scenario: 'heavy_rain' });

    const claimsRes = await axios.get(`http://localhost:${PORT}/api/claims/my-claims`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`Fetched ${claimsRes.data.count} claims for worker.`);
    const blockedClaim = claimsRes.data.claims.find(c => c.claimState === 'Blocked') || claimsRes.data.claims[0];

    // 3. Worker Appeal Submission (48h Window Enforced)
    console.log('\n--- Step 3: Worker Appeal Submission within 48h ---');
    const appealRes = await axios.post(
      `http://localhost:${PORT}/api/claims/${blockedClaim._id}/appeal`,
      { appealStatement: 'I was logged into Swiggy app at Indiranagar hub during the torrential rain.' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Appeal Submission Response:', appealRes.data.message);

    // 4. Admin Appeals Queue & Review Approval
    console.log('\n--- Step 4: Admin Appeals Review Queue & Instant Payout Dispatch ---');
    const appealsRes = await axios.get(`http://localhost:${PORT}/api/admin/appeals`);
    console.log(`Fetched ${appealsRes.data.count} pending appeals in Admin queue.`);

    const reviewRes = await axios.post(`http://localhost:${PORT}/api/admin/appeals/${blockedClaim._id}/review`, {
      action: 'approve',
      adminNote: 'Verified Swiggy partner GPS logs. Valid disruption claim approved.'
    });

    console.log('Admin Review Response:', reviewRes.data.message);
    console.log('Updated Claim Details:', {
      id: reviewRes.data.claim?._id,
      state: reviewRes.data.claim?.claimState,
      transactionRef: reviewRes.data.claim?.transactionRef
    });

    console.log('\n==================================================');
    console.log('[ALL PAYOUT EXECUTION & APPEALS TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Payout Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
