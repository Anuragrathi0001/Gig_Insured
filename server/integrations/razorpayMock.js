/**
 * Simulated Razorpay X Payouts Gateway Integration for Gig Insured
 * Simulates instant 24x7 UPI transfers to delivery worker UPI IDs (e.g., worker@paytm, worker@ybl)
 */

let simulatePayoutFailures = false;

const setSimulatePayoutFailures = (flag) => {
  simulatePayoutFailures = flag;
  console.log(`[RazorpayX Payout Gateway]: Failure simulation flag set to -> ${flag}`);
};

/**
 * Dispatch Instant UPI Payout with 3-tier Automatic Retry Mechanism
 */
const dispatchUpiPayout = async ({ amount, upiId, claimId, workerName = 'Delivery Partner' }) => {
  const maxRetries = 3;
  let attempt = 0;
  let lastError = null;

  const targetUpi = upiId || 'worker@paytm';

  while (attempt < maxRetries) {
    attempt++;
    console.log(`[RazorpayX Payout Gateway]: Attempt ${attempt}/${maxRetries} -> Initiating ₹${amount} UPI Payout to ${targetUpi} (Claim: ${claimId})...`);

    // Simulate small failure rate if scenario flag is set for retry demo
    const isFailedAttempt = simulatePayoutFailures && attempt < maxRetries;

    if (isFailedAttempt) {
      lastError = `Razorpay NPCI Bank Gateway Timeout (Attempt ${attempt})`;
      console.warn(`[RazorpayX Payout Warning]: Attempt ${attempt} failed: ${lastError}. Retrying with exponential backoff...`);
      // Short delay before retry
      await new Promise(res => setTimeout(res, 300));
      continue;
    }

    // Success Outcome
    const transactionRef = `RZP_PYUT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    console.log(`==================================================`);
    console.log(`[RazorpayX Payout Gateway SUCCESS]:`);
    console.log(`Status: PROCESSED | Ref: ${transactionRef}`);
    console.log(`Amount: ₹${amount} | Mode: UPI | Target: ${targetUpi} (${workerName})`);
    console.log(`Dispatched At: ${timestamp}`);
    console.log(`==================================================\n`);

    return {
      success: true,
      transactionRef,
      status: 'PROCESSED',
      mode: 'UPI',
      upiId: targetUpi,
      amount,
      attemptCount: attempt,
      dispatchedAt: timestamp
    };
  }

  // All 3 retries exhausted
  console.error(`[RazorpayX Payout CRITICAL FAILURE]: All ${maxRetries} payout attempts failed for Claim ${claimId}. Flagging for Admin Review.`);
  return {
    success: false,
    status: 'FAILED',
    error: lastError || 'Razorpay Payout Retries Exhausted',
    attemptCount: maxRetries
  };
};

module.exports = {
  dispatchUpiPayout,
  setSimulatePayoutFailures
};
