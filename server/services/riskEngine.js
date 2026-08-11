/**
 * Rule-Based Risk Profile Engine for Gig Insured
 * Evaluates zone historical trigger frequency, monsoon/heatwave vulnerability,
 * and delivery platform exposure to generate risk scores.
 */

// Zone risk baseline weight matrix (0 - 100)
const ZONE_RISK_MAP = {
  // Bengaluru
  Indiranagar: { baseZoneRisk: 42, weatherExposure: 58 },
  Koramangala: { baseZoneRisk: 55, weatherExposure: 65 }, // Flood prone
  Whitefield: { baseZoneRisk: 48, weatherExposure: 52 },
  HSR_Layout: { baseZoneRisk: 50, weatherExposure: 60 },

  // Mumbai
  Andheri: { baseZoneRisk: 78, weatherExposure: 85 }, // Heavy waterlogging
  Bandra: { baseZoneRisk: 72, weatherExposure: 80 },
  Powai: { baseZoneRisk: 65, weatherExposure: 70 },
  Dadar: { baseZoneRisk: 82, weatherExposure: 88 },

  // Delhi NCR
  Connaught_Place: { baseZoneRisk: 68, weatherExposure: 75 }, // Extreme Heat & AQI
  Gurgaon: { baseZoneRisk: 70, weatherExposure: 78 }, // Urban flooding
  Noida: { baseZoneRisk: 64, weatherExposure: 72 },

  // Default fallback
  Default: { baseZoneRisk: 50, weatherExposure: 50 }
};

/**
 * Calculate Risk Profile for a Worker
 * 
 * TODO: Replace this rule-based heuristic function with a real Machine Learning
 * inference engine model (e.g. XGBoost / Gradient Boosted Decision Tree model microservice)
 * trained on historical IMD weather observations, civic disruption logs, and worker GPS telemetry.
 */
const calculateRiskProfile = ({ city, zone, platform, avgWeeklyIncome }) => {
  const normalizedZoneKey = (zone || '').replace(/\s+/g, '_');
  const zoneStats = ZONE_RISK_MAP[normalizedZoneKey] || ZONE_RISK_MAP.Default;

  let zoneRiskScore = zoneStats.baseZoneRisk;
  let weatherExposureScore = zoneStats.weatherExposure;

  // Platform adjustment (Swiggy / Zomato order volume shifts)
  if (platform === 'Swiggy') {
    zoneRiskScore += 3;
  } else if (platform === 'Zomato') {
    zoneRiskScore += 2;
  }

  // Weekly income multiplier (higher weekly income indicates more hours exposed to weather)
  if (avgWeeklyIncome > 7000) {
    weatherExposureScore += 8;
  } else if (avgWeeklyIncome > 5000) {
    weatherExposureScore += 4;
  }

  // Clamp scores between 10 and 95
  zoneRiskScore = Math.min(Math.max(Math.round(zoneRiskScore), 10), 95);
  weatherExposureScore = Math.min(Math.max(Math.round(weatherExposureScore), 10), 95);

  return {
    zoneRiskScore,
    weatherExposureScore,
    calculatedAt: new Date().toISOString(),
    engineVersion: 'v1.0-rule-based-prototype'
  };
};

module.exports = {
  calculateRiskProfile
};
