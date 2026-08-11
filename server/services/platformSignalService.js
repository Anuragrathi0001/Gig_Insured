/**
 * Platform Telemetry & Social Disruption Signal Service for Gig Insured
 * Simulates real-time order volume drops, worker density, and civic curfew/strike signals
 * from delivery partner platforms (Zomato / Swiggy).
 */

const mockWeatherData = require('./mockWeatherData');

const getZonePlatformSignals = (zoneName) => {
  const normalizedZone = (zoneName || '').replace(/\s+/g, '_');
  
  let orderDropPercentage = Math.floor(5 + Math.random() * 15); // Baseline 5-20% drop
  let civicDisruptionFlag = false;
  let activeWorkerCount = Math.floor(120 + Math.random() * 80);
  let signalsUsed = [];

  // Check if active weather simulation scenario is set
  const weatherData = mockWeatherData.generateMockWeather(zoneName);

  if (weatherData.rainMmPerHour >= 20 || weatherData.heatTempCelsius >= 42 || weatherData.aqi >= 300 || weatherData.floodWaterLevelCm >= 15) {
    // Environmental disruption detected -> Delivery order volume drops sharply
    orderDropPercentage = Math.floor(55 + Math.random() * 30); // 55% - 85% order drop
    activeWorkerCount = Math.floor(20 + Math.random() * 25); // Workers stop accepting orders
  }

  if (orderDropPercentage >= 40) {
    signalsUsed.push(`Delivery Platform Order Volume Drop: ${orderDropPercentage}% (Threshold >= 40%)`);
    signalsUsed.push(`Active Worker Density Drop: ${activeWorkerCount} active partners remaining`);
  }

  return {
    zoneName,
    orderDropPercentage,
    activeWorkerCount,
    civicDisruptionFlag,
    signalsUsed,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  getZonePlatformSignals
};
