const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const otpService = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// In-memory worker fallback store when Supabase is offline
const mockWorkerStore = new Map();

/**
 * Generate 7-day JWT token
 */
const generateToken = (id, mobile) => {
  return jwt.sign({ id, mobile }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * @desc    Send OTP to mobile number
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile.toString().trim())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid 10-digit Indian mobile number'
      });
    }

    const cleanMobile = mobile.toString().trim();
    const otp = otpService.generateOtp(cleanMobile);

    return res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully.',
      mobile: cleanMobile,
      devOtpHint: otp
    });
  } catch (error) {
    return res.status(429).json({
      status: 'fail',
      message: error.message || 'Failed to send OTP'
    });
  }
};

/**
 * @desc    Verify OTP & Login/Register worker
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Both mobile number and OTP are required'
      });
    }

    const cleanMobile = mobile.toString().trim();
    const verification = otpService.verifyOtp(cleanMobile, otp);

    if (!verification.valid) {
      return res.status(400).json({
        status: 'fail',
        message: verification.message
      });
    }

    let worker = null;

    if (process.env.SUPABASE_URL) {
      // Try to find existing worker
      const { data: existing } = await supabase
        .from('workers')
        .select('*')
        .eq('mobile', cleanMobile)
        .single();

      if (existing) {
        worker = existing;
      } else {
        // Create a new worker shell on first OTP verification
        const { data: created, error } = await supabase
          .from('workers')
          .insert({
            mobile: cleanMobile,
            name: '',
            city: '',
            zone: '',
            platform: 'Zomato',
            worker_id: `WORKER-${cleanMobile.slice(-4)}-${Date.now()}`,
            avg_weekly_income: 4500,
            upi_id: ''
          })
          .select()
          .single();

        if (error) {
          console.error('[Auth verifyOtp]: Supabase insert error:', error.message);
          throw new Error(error.message);
        }
        worker = created;
      }
    } else {
      // In-memory fallback
      console.log('[Auth]: SUPABASE_URL not set. Using in-memory worker store.');
      worker = mockWorkerStore.get(cleanMobile);

      if (!worker) {
        worker = {
          id: `worker_${Date.now()}`,
          mobile: cleanMobile,
          name: '',
          city: '',
          zone: '',
          platform: 'Zomato',
          worker_id: `WORKER-${cleanMobile.slice(-4)}`,
          avg_weekly_income: 4500,
          upi_id: '',
          isNew: true
        };
        mockWorkerStore.set(cleanMobile, worker);
      }
    }

    const token = generateToken(worker.id, worker.mobile);

    return res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully',
      token,
      worker
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error during OTP verification'
    });
  }
};

/**
 * @desc    Get current authenticated worker profile
 * @route   GET /api/auth/me
 * @access  Private (JWT Protected)
 */
const getMe = async (req, res) => {
  try {
    let worker = null;

    if (process.env.SUPABASE_URL) {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', req.worker.id)
        .single();

      if (error) throw new Error(error.message);
      worker = data;
    } else {
      worker = mockWorkerStore.get(req.worker.mobile) || req.worker;
    }

    if (!worker) {
      return res.status(404).json({
        status: 'fail',
        message: 'Worker profile not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      worker
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve worker profile'
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  mockWorkerStore
};
