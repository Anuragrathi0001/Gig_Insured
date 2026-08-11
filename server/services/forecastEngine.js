/**
 * Predictive Disruption & Claim Forecasting Engine for Gig Insured
 * 
 * TODO: HACKATHON MVP RULE-BASED FORECASTING ENGINE
 * In production, swap this rule-based model for an ML time-series pipeline (e.g. LSTM / XGBoost)
 * trained on 5-year monsoon rainfall, OpenWeather historical archives, CPCB AQI trends, and Swiggy/Zomato order density patterns.
 */

const weatherService = require('./weatherService');
const zoneData = require('./zoneData');

/**
 * Predict Next Week's Disruption Volume & Financial Exposure per Zone
 */
const generateNextWeekForecast = async () => {
  const zones = zoneData.getActiveZones();
  const forecastResults = [];

  for (const zone of zones) {
    const liveWeather = await weatherService.getZoneWeather(zone.zoneName);
    const thresholds = zone.triggerThresholds || { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300 };

    // Baseline rule-based predictive calculation
    let disruptionProb = Math.floor(25 + Math.random() * 20); // 25-45% baseline
    let primaryRiskFactor = 'Monsoon Rain & Urban Waterlogging';
    let heatLevel = 'MODERATE_RISK';

    if (liveWeather.rainMmPerHour > 10 || liveWeather.floodWaterLevelCm > 5) {
      disruptionProb = Math.floor(65 + Math.random() * 25); // 65-90% high risk
      primaryRiskFactor = 'Heavy Rainfall & Urban Flash Flooding';
      heatLevel = 'CRITICAL_RISK';
    } else if (liveWeather.heatTempCelsius >= 38) {
      disruptionProb = Math.floor(55 + Math.random() * 25);
      primaryRiskFactor = 'Severe Summer Heatwave Exposure';
      heatLevel = 'HIGH_RISK';
    } else if (liveWeather.aqi >= 250) {
      disruptionProb = Math.floor(60 + Math.random() * 20);
      primaryRiskFactor = 'Hazardous Air Quality / AQI Smog';
      heatLevel = 'HIGH_RISK';
    }

    const projectedWorkerCount = 45;
    const projectedClaimVolume = Math.round(projectedWorkerCount * (disruptionProb / 100));
    const avgClaimPayout = 400; // ₹400 avg payout per claim
    const projectedPayoutExposure = projectedClaimVolume * avgClaimPayout;

    const zoneRiskScore = Math.min(Math.max(Math.round(disruptionProb * 0.95), 20), 98);

    forecastResults.push({
      zoneId: zone._id,
      zoneName: zone.zoneName,
      city: zone.city,
      predictedDisruptionProbability: disruptionProb,
      projectedClaimVolume,
      projectedPayoutExposure,
      zoneRiskScore,
      heatLevel,
      primaryRiskFactor,
      geoCoordinates: zone.geoBoundary?.coordinates?.[0] || [],
      thresholds
    });
  }

  return forecastResults;
};

/**
 * Generate Heatmap Data Payload (Claims Density + Spatial Coordinates)
 */
const generateZoneHeatmap = async () => {
  const forecasts = await generateNextWeekForecast();

  return forecasts.map(f => ({
    zoneName: f.zoneName,
    city: f.city,
    claimsDensityScore: f.projectedClaimVolume,
    zoneRiskScore: f.zoneRiskScore,
    heatLevel: f.heatLevel,
    riskFactor: f.primaryRiskFactor,
    disruptionProb: f.predictedDisruptionProbability,
    coordinates: f.geoCoordinates
  }));
};

module.exports = {
  generateNextWeekForecast,
  generateZoneHeatmap
};
