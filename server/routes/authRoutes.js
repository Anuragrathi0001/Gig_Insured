const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public OTP Routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Protected Auth Routes
router.get('/me', protect, getMe);

module.exports = router;
