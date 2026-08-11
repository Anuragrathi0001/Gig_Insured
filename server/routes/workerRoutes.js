const express = require('express');
const router = express.Router();
const { onboardWorker, getWorkerProfile, getWorkerDashboard } = require('../controllers/workerController');
const { protect } = require('../middleware/authMiddleware');

// Protected Worker Onboarding, Profile & Dashboard Endpoints
router.post('/onboard', protect, onboardWorker);
router.get('/me', protect, getWorkerProfile);
router.get('/dashboard', protect, getWorkerDashboard);

module.exports = router;
