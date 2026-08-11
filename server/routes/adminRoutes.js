const express = require('express');
const router = express.Router();
const { getZones, createZone, updateZone, simulateDisruption, simulateFraudAttack, getAdminOverview, getForecast, getHeatmap, getFraudQueue, resolveQueuedClaim, getTriggerEvents, getFraudFlags, getPendingAppeals, reviewClaimAppeal } = require('../controllers/adminController');
const { getAllClaims } = require('../controllers/claimController');

// Admin Zone Config & Disruption Management Endpoints
router.get('/zones', getZones);
router.post('/zones', createZone);
router.put('/zones/:id', updateZone);
router.post('/simulate-disruption', simulateDisruption);
router.post('/simulate-fraud', simulateFraudAttack);

// Admin Analytics Overview & Loss Ratio
router.get('/overview', getAdminOverview);

// Predictive Analytics & Spatial Heatmap Endpoints
router.get('/forecast', getForecast);
router.get('/heatmap', getHeatmap);

// Admin Fraud Queue & Telemetry Evidence Drill-Down
router.get('/fraud-queue', getFraudQueue);
router.post('/claims/:id/resolve', resolveQueuedClaim);

// Admin Audit Logs & Appeals Review Queue
router.get('/triggers', getTriggerEvents);
router.get('/claims', getAllClaims);
router.get('/fraud-flags', getFraudFlags);
router.get('/appeals', getPendingAppeals);
router.post('/appeals/:id/review', reviewClaimAppeal);

module.exports = router;
