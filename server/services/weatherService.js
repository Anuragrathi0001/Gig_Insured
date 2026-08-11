const axios = require('axios');
const mockWeatherData = require('./mockWeatherData');

/**
 * Weather Service for Gig Insured
 * Ingests live rainfall, temperature, and AQI metrics for parametric disruption evaluation.
 */
const getZoneWeather = async (zoneName, lat, lon) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const targetLat = lat || mockWeatherData.ZONE_COORDINATES[(zoneName || '').replace(/\s+/g, '_')]?.lat || 12.9784;
  const targetLon = lon || mockWeatherData.ZONE_COORDINATES[(zoneName || '').replace(/\s+/g, '_')]?.lon || 77.6408;

  // Check if real API key is configured
  if (apiKey && apiKey !== 'your_openweather_api_key_here') {
    try {
      console.log(`[WeatherService]: Fetching live OpenWeatherMap API telemetry for ${zoneName} (${targetLat}, ${targetLon})...`);

      // 1. Fetch current weather (temperature, rain)
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${targetLat}&lon=${targetLon}&units=metric&appid=${apiKey}`;
      const weatherRes = await axios.get(weatherUrl, { timeout: 4000 });

      // 2. Fetch air pollution (AQI)
      const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${targetLat}&lon=${targetLon}&appid=${apiKey}`;
      const aqiRes = await axios.get(aqiUrl, { timeout: 4000 });

      const mainData = weatherRes.data.main || {};
      const rainData = weatherRes.data.rain || {};
      const weatherDesc = weatherRes.data.weather?.[0]?.description || 'Clear';

      // OpenWeather AQI is 1-5 scale, map to standard US AQI equivalent (1=40, 2=80, 3=150, 4=250, 5=350)
      const rawAqiScale = aqiRes.data.list?.[0]?.main?.aqi || 2;
      const mappedAqi = rawAqiScale * 70;

      const liveData = {
        zoneName,
        coordinates: { lat: targetLat, lon: targetLon },
        rainMmPerHour: rainData['1h'] || 0,
        heatTempCelsius: Math.round(mainData.temp || 30),
        aqi: mappedAqi,
        floodWaterLevelCm: rainData['1h'] ? Math.round((rainData['1h'] || 0) * 0.6) : 0,
        windSpeedKmph: Math.round((weatherRes.data.wind?.speed || 3) * 3.6),
        weatherDescription: weatherDesc,
        source: 'OpenWeatherMap Live API',
        timestamp: new Date().toISOString()
      };

      console.log(`[WeatherService SUCCESS]: Live OpenWeatherMap data ingested for ${zoneName}: Rain=${liveData.rainMmPerHour}mm/h, Temp=${liveData.heatTempCelsius}°C, AQI=${liveData.aqi}`);
      return liveData;

    } catch (error) {
      console.warn(`[WeatherService WARNING]: OpenWeatherMap API call failed/timed out (${error.message}). Falling back to mock weather generator.`);
    }
  } else {
    console.log(`[WeatherService INFO]: OPENWEATHER_API_KEY missing or default. Falling back to mockWeatherData generator for ${zoneName}.`);
  }

  // Fallback to Mock Data Generator
  return mockWeatherData.generateMockWeather(zoneName);
};

module.exports = {
  getZoneWeather,
  setSimulationScenario: mockWeatherData.setSimulationScenario
};
