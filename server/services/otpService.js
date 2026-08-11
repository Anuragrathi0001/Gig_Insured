// In-memory OTP storage and rate limiting service
const otpStore = new Map(); // mobile -> { otp, expiresAt }
const rateLimitStore = new Map(); // mobile -> Array of timestamps

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_OTP_REQUESTS_PER_HOUR = 20;

/**
 * Check rate limit for a given mobile number
 */
const checkRateLimit = (mobile) => {
  const now = Date.now();
  let timestamps = rateLimitStore.get(mobile) || [];
  
  // Clean up timestamps outside the 1-hour window
  timestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  rateLimitStore.set(mobile, timestamps);

  if (timestamps.length >= MAX_OTP_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      message: `Rate limit exceeded. Maximum ${MAX_OTP_REQUESTS_PER_HOUR} OTP requests allowed per hour.`
    };
  }

  return { allowed: true };
};

/**
 * Record an OTP request timestamp
 */
const recordOtpRequest = (mobile) => {
  const timestamps = rateLimitStore.get(mobile) || [];
  timestamps.push(Date.now());
  rateLimitStore.set(mobile, timestamps);
};

/**
 * Generate 6-digit OTP and store it with 10-minute expiry
 */
const generateOtp = (mobile) => {
  const rateLimitCheck = checkRateLimit(mobile);
  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.message);
  }

  // Generate random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(mobile, { otp, expiresAt });
  recordOtpRequest(mobile);

  // Hackathon Console Logger
  console.log(`\n==================================================`);
  console.log(`[SMS Gateway Mock] OTP for +91-${mobile}: [ ${otp} ] (Expires in 10 mins)`);
  console.log(`==================================================\n`);

  return otp;
};

/**
 * Verify mobile + OTP (Accepts generated OTP or universal demo code '123456')
 */
const verifyOtp = (mobile, inputOtp) => {
  const cleanOtp = inputOtp.toString().trim();

  // Universal demo code fallback for live pitch testing
  if (cleanOtp === '123456') {
    otpStore.delete(mobile);
    return { valid: true };
  }

  const record = otpStore.get(mobile);

  if (!record) {
    return { valid: false, message: 'No OTP requested for this mobile number or it has expired. Try entering code 123456.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(mobile);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.otp !== cleanOtp) {
    return { valid: false, message: 'Invalid OTP code. Please check and try again or use 123456.' };
  }

  // Clear OTP once verified successfully
  otpStore.delete(mobile);
  return { valid: true };
};

module.exports = {
  generateOtp,
  verifyOtp,
  checkRateLimit
};
