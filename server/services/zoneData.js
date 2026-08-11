/**
 * Shared Default Zone Configuration Store for Gig Insured
 */

const DEFAULT_ZONES = [
  {
    _id: 'zone_indiranagar_01',
    zoneName: 'Indiranagar',
    city: 'Bengaluru',
    geoBoundary: {
      type: 'Polygon',
      coordinates: [[[77.63, 12.97], [77.65, 12.97], [77.65, 12.99], [77.63, 12.99], [77.63, 12.97]]]
    },
    triggerThresholds: { rainMmPerHour: 20, heatTempCelsius: 40, aqiThreshold: 300, floodWaterLevelCm: 15 },
    premiumBand: { Basic: 25, Standard: 45, Premium: 75 }
  },
  {
    _id: 'zone_koramangala_02',
    zoneName: 'Koramangala',
    city: 'Bengaluru',
    geoBoundary: {
      type: 'Polygon',
      coordinates: [[[77.61, 12.92], [77.635, 12.92], [77.635, 12.945], [77.61, 12.945], [77.61, 12.92]]]
    },
    triggerThresholds: { rainMmPerHour: 18, heatTempCelsius: 40, aqiThreshold: 300, floodWaterLevelCm: 12 },
    premiumBand: { Basic: 28, Standard: 50, Premium: 82 }
  },
  {
    _id: 'zone_andheri_03',
    zoneName: 'Andheri',
    city: 'Mumbai',
    geoBoundary: {
      type: 'Polygon',
      coordinates: [[[72.82, 19.1], [72.87, 19.1], [72.87, 19.14], [72.82, 19.14], [72.82, 19.1]]]
    },
    triggerThresholds: { rainMmPerHour: 22, heatTempCelsius: 38, aqiThreshold: 280, floodWaterLevelCm: 18 },
    premiumBand: { Basic: 32, Standard: 58, Premium: 95 }
  },
  {
    _id: 'zone_cp_04',
    zoneName: 'Connaught Place',
    city: 'Delhi NCR',
    geoBoundary: {
      type: 'Polygon',
      coordinates: [[[77.20, 28.62], [77.23, 28.62], [77.23, 28.65], [77.20, 28.65], [77.20, 28.62]]]
    },
    triggerThresholds: { rainMmPerHour: 25, heatTempCelsius: 43, aqiThreshold: 350, floodWaterLevelCm: 10 },
    premiumBand: { Basic: 30, Standard: 52, Premium: 88 }
  }
];

let activeZonesStore = [...DEFAULT_ZONES];

const getActiveZones = () => activeZonesStore;

const updateZoneInStore = (id, updatedFields) => {
  const idx = activeZonesStore.findIndex(z => z._id === id || z.zoneName === id);
  if (idx !== -1) {
    if (updatedFields.triggerThresholds) {
      activeZonesStore[idx].triggerThresholds = { ...activeZonesStore[idx].triggerThresholds, ...updatedFields.triggerThresholds };
    }
    if (updatedFields.premiumBand) {
      activeZonesStore[idx].premiumBand = { ...activeZonesStore[idx].premiumBand, ...updatedFields.premiumBand };
    }
    return activeZonesStore[idx];
  }
  return null;
};

const addZoneToStore = (newZone) => {
  activeZonesStore.push(newZone);
  return newZone;
};

module.exports = {
  DEFAULT_ZONES,
  getActiveZones,
  updateZoneInStore,
  addZoneToStore
};
