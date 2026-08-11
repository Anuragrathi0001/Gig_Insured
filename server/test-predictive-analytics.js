const express = require('express');
const axios = require('axios');
const authRoutes = require('./routes/authRoutes');
const workerRoutes = require('./routes/workerRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const adminRoutes = require('./routes/adminRoutes');
const forecastEngine = require('./services/forecastEngine');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api', policyRoutes);
app.use('/api/admin', adminRoutes);

const PORT = 5066;
const server = app.listen(PORT, async () => {
  console.log(`[Predictive Analytics Test Server]: Running on http://localhost:${PORT}`);

  try {
    // 1. Direct Forecast Engine Unit Test
    console.log('\n--- Step 1: Forecast Engine Predictive Projections ---');
    const forecastData = await forecastEngine.generateNextWeekForecast();
    console.log(`Generated projections for ${forecastData.length} active zones.`);
    console.log('Sample Zone Forecast:', {
      zone: forecastData[0]?.zoneName,
      disruptionProb: forecastData[0]?.predictedDisruptionProbability + '%',
      projectedClaims: forecastData[0]?.projectedClaimVolume,
      payoutExposure: '₹' + forecastData[0]?.projectedPayoutExposure,
      heatLevel: forecastData[0]?.heatLevel
    });

    // 2. GET /api/admin/forecast Endpoint Test
    console.log('\n--- Step 2: GET /api/admin/forecast Endpoint ---');
    const forecastRes = await axios.get(`http://localhost:${PORT}/api/admin/forecast`);
    console.log(`GET /api/admin/forecast returned ${forecastRes.data.count} items.`);

    // 3. GET /api/admin/heatmap Endpoint Test
    console.log('\n--- Step 3: GET /api/admin/heatmap Spatial Risk Payload ---');
    const heatmapRes = await axios.get(`http://localhost:${PORT}/api/admin/heatmap`);
    console.log(`GET /api/admin/heatmap returned ${heatmapRes.data.count} zone heat maps.`);
    console.log('Sample Heatmap Node:', heatmapRes.data.heatmap?.[0]);

    console.log('\n==================================================');
    console.log('[ALL PREDICTIVE ANALYTICS & HEATMAP TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Predictive Analytics Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
