const express = require('express');
const router = express.Router();
const {
  getPremiumQuotes,
  mockUpiPayment,
  activatePolicy,
  getActivePolicy
} = require('../controllers/policyController');
const { protect } = require('../middleware/authMiddleware');

// Protected Premium Quote Routes
router.get('/premium/quote', protect, getPremiumQuotes);

// Protected Payment & Policy Routes
router.post('/payments/mock-upi', protect, mockUpiPayment);
router.post('/policy/activate', protect, activatePolicy);
router.get('/policy/active', protect, getActivePolicy);

module.exports = router;
