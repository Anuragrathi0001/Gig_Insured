/**
 * Mock Weather & AQI Telemetry Generator for Gig Insured
 * Generates plausible environmental telemetry when real API keys are missing or offline.
 */

// Zone coordinate dictionary for demo cities
const ZONE_COORDINATES = {
  Indiranagar: { lat: 12.9784, lon: 77.6408, city: 'Bengaluru' },
  Koramangala: { lat: 12.9352, lon: 77.6245, city: 'Bengaluru' },
  Whitefield: { lat: 12.9698, lon: 77.7500, city: 'Bengaluru' },
  HSR_Layout: { lat: 12.9121, lon: 77.6446, city: 'Bengaluru' },
  Andheri: { lat: 19.1197, lon: 72.8464, city: 'Mumbai' },
  Bandra: { lat: 19.0596, lon: 72.8295, city: 'Mumbai' },
  Powai: { lat: 19.1176, lon: 72.9060, city: 'Mumbai' },
  Connaught_Place: { lat: 28.6315, lon: 77.2167, city: 'Delhi NCR' },
  Gurgaon: { lat: 28.4595, lon: 77.0266, city: 'Delhi NCR' },
  Noida: { lat: 28.5355, lon: 77.3910, city: 'Delhi NCR' }
};

// Global active simulation scenario override (null = random plausible baseline)
let activeSimulationScenario = null;

const setSimulationScenario = (scenario) => {
  activeSimulationScenario = scenario;
  console.log(`[MockWeather]: Active simulation scenario set to -> ${scenario || 'NORMAL_BASE'}`);
};

const generateMockWeather = (zoneName = 'Indiranagar') => {
  const normalizedZone = (zoneName || '').replace(/\s+/g, '_');
  const coords = ZONE_COORDINATES[normalizedZone] || { lat: 12.9784, lon: 77.6408, city: 'Bengaluru' };

  let telemetry = {
    zoneName: zoneName,
    city: coords.city,
    coordinates: { lat: coords.lat, lon: coords.lon },
    rainMmPerHour: Math.floor(Math.random() * 12), // Baseline 0-12 mm/hr
    heatTempCelsius: Math.floor(30 + Math.random() * 8), // Baseline 30-38 °C
    aqi: Math.floor(100 + Math.random() * 120), // Baseline AQI 100-220
    floodWaterLevelCm: Math.floor(Math.random() * 5),
    windSpeedKmph: Math.floor(10 + Math.random() * 15),
    weatherDescription: 'Scattered clouds',
    source: 'Mock Generator (Plausible Simulation)',
    timestamp: new Date().toISOString()
  };

  // Scenario Presets for Testing & Live Demonstration
  if (activeSimulationScenario === 'heavy_rain' || activeSimulationScenario === 'MONSOON_DISRUPTION') {
    telemetry.rainMmPerHour = 38; // Exceeds 20mm/hr threshold
    telemetry.weatherDescription = 'Torrential Downpour & Heavy Thunderstorm';
    telemetry.floodWaterLevelCm = 22;
  } else if (activeSimulationScenario === 'extreme_heat' || activeSimulationScenario === 'HEATWAVE_ALERT') {
    telemetry.heatTempCelsius = 44; // Exceeds 42°C threshold
    telemetry.weatherDescription = 'Severe Heatwave Emergency';
  } else if (activeSimulationScenario === 'hazardous_aqi' || activeSimulationScenario === 'AQI_HAZARD') {
    telemetry.aqi = 360; // Exceeds 300 AQI threshold
    telemetry.weatherDescription = 'Hazardous Air Quality Warning';
  } else if (activeSimulationScenario === 'severe_flood' || activeSimulationScenario === 'FLOOD_EMERGENCY') {
    telemetry.rainMmPerHour = 45;
    telemetry.floodWaterLevelCm = 28; // Exceeds 15cm threshold
    telemetry.weatherDescription = 'Flash Flood & Urban Inundation Alert';
  }

  return telemetry;
};

module.exports = {
  generateMockWeather,
  setSimulationScenario,
  ZONE_COORDINATES
};
