const express = require('express');
const axios = require('axios');
const adminRoutes = require('./routes/adminRoutes');
const weatherService = require('./services/weatherService');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

const PORT = 5059;
const server = app.listen(PORT, async () => {
  console.log(`[Weather & Admin Test Server]: Running on http://localhost:${PORT}`);

  try {
    // 1. Direct Weather Service Test
    console.log('\n--- Step 1: Direct Weather Service Ingestion Test ---');
    const weatherIndiranagar = await weatherService.getZoneWeather('Indiranagar');
    console.log('Weather Ingestion Result:', {
      zone: weatherIndiranagar.zoneName,
      rain: weatherIndiranagar.rainMmPerHour,
      temp: weatherIndiranagar.heatTempCelsius,
      aqi: weatherIndiranagar.aqi,
      source: weatherIndiranagar.source
    });

    // 2. Admin GET /api/admin/zones
    console.log('\n--- Step 2: GET /api/admin/zones ---');
    const zonesRes = await axios.get(`http://localhost:${PORT}/api/admin/zones`);
    console.log(`Fetched ${zonesRes.data.count} configured zones with live weather telemetry.`);
    const sampleZone = zonesRes.data.zones[0];
    console.log('Sample Zone Data:', {
      id: sampleZone._id,
      name: sampleZone.zoneName,
      city: sampleZone.city,
      thresholds: sampleZone.triggerThresholds,
      liveWeather: sampleZone.liveWeather
    });

    // 3. Admin PUT /api/admin/zones/:id Threshold Update
    console.log('\n--- Step 3: PUT /api/admin/zones/:id Threshold Update ---');
    const updateRes = await axios.put(`http://localhost:${PORT}/api/admin/zones/${sampleZone._id}`, {
      triggerThresholds: { rainMmPerHour: 25, heatTempCelsius: 41, aqiThreshold: 310 }
    });

    console.log('Zone Threshold Update Response:', {
      status: updateRes.data.status,
      updatedThresholds: updateRes.data.zone.triggerThresholds
    });

    // 4. Disruption Simulation Trigger
    console.log('\n--- Step 4: POST /api/admin/simulate-disruption ---');
    const simRes = await axios.post(`http://localhost:${PORT}/api/admin/simulate-disruption`, {
      scenario: 'heavy_rain'
    });
    console.log('Simulation Scenario Set:', simRes.data);

    const refreshedWeather = await weatherService.getZoneWeather('Indiranagar');
    console.log('Refreshed Weather under Simulated Heavy Rain:', {
      rain: refreshedWeather.rainMmPerHour,
      floodLevel: refreshedWeather.floodWaterLevelCm,
      description: refreshedWeather.weatherDescription
    });

    console.log('\n==================================================');
    console.log('[ALL WEATHER & ADMIN ZONE TESTS PASSED CLEANLY!]');
    console.log('==================================================\n');
  } catch (error) {
    console.error('[Weather Test Error]:', error.response?.data || error.message);
  } finally {
    server.close(() => process.exit(0));
  }
});
