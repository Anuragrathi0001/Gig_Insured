const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Worker } = require('../models');
const otpService = require('../services/otpService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// In-memory worker fallback store when MongoDB is offline
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
      message: 'OTP sent successfully. For hackathon testing, inspect the server console for the 6-digit OTP code.',
      mobile: cleanMobile,
      devOtpHint: process.env.NODE_ENV !== 'production' ? otp : undefined
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
    let isNewWorker = false;
    const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

    if (isDbConnected) {
      worker = await Worker.findOne({ mobile: cleanMobile });
      if (!worker) {
        isNewWorker = true;
        const uniqueSuffix = Date.now().toString().slice(-6);
        worker = await Worker.create({
          name: `Delivery Partner ${uniqueSuffix}`,
          mobile: cleanMobile,
          city: 'Bengaluru',
          zone: 'Indiranagar',
          platform: 'Zomato',
          workerId: `WRK-${cleanMobile.slice(-4)}-${uniqueSuffix}`,
          avgWeeklyIncome: 4500,
          kycStatus: 'pending',
          riskProfile: { zoneRiskScore: 45, weatherExposureScore: 60 },
          upiId: `${cleanMobile}@paytm`
        });
      }
    } else {
      // Offline / Fallback In-Memory Mode
      console.log('[Auth]: MongoDB not connected. Using in-memory worker store.');
      if (mockWorkerStore.has(cleanMobile)) {
        worker = mockWorkerStore.get(cleanMobile);
      } else {
        isNewWorker = true;
        const uniqueSuffix = Date.now().toString().slice(-6);
        worker = {
          _id: `mock_id_${cleanMobile}_${uniqueSuffix}`,
          name: `Delivery Partner ${uniqueSuffix}`,
          mobile: cleanMobile,
          city: 'Bengaluru',
          zone: 'Indiranagar',
          platform: 'Zomato',
          workerId: `WRK-${cleanMobile.slice(-4)}-${uniqueSuffix}`,
          avgWeeklyIncome: 4500,
          kycStatus: 'verified',
          riskProfile: { zoneRiskScore: 45, weatherExposureScore: 60 },
          upiId: `${cleanMobile}@paytm`,
          createdAt: new Date()
        };
        mockWorkerStore.set(cleanMobile, worker);
      }
    }

    const token = generateToken(worker._id, worker.mobile);

    return res.status(200).json({
      status: 'success',
      message: isNewWorker ? 'Account created successfully' : 'Login successful',
      token,
      isNewWorker,
      worker
    });
  } catch (error) {
    console.error(`[Verify OTP Error]: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during OTP verification'
    });
  }
};

/**
 * @desc    Get current authenticated worker profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      status: 'success',
      worker: req.worker
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve profile'
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  getMe,
  mockWorkerStore
};
