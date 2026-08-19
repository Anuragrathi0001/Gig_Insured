const express = require('express');
const router = express.Router();
const { googleLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Firebase Google Auth Route
router.post('/google-login', googleLogin);

// Protected Auth Routes
router.get('/me', protect, getMe);

module.exports = router;
