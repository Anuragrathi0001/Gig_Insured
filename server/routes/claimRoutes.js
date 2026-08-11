const express = require('express');
const router = express.Router();
const { getMyClaims, verifyPayoutOtp, submitAppeal } = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');

// Protected Worker Claims Endpoints
router.get('/my-claims', protect, getMyClaims);
router.post('/:id/verify-payout-otp', protect, verifyPayoutOtp);
router.post('/:id/appeal', protect, submitAppeal);

module.exports = router;
