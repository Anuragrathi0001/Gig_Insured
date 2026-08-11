const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const ZoneConfig = require('../models/ZoneConfig');

const DEMO_ZONES = [
  {
    zoneName: 'Indiranagar',
    city: 'Bengaluru',
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [
          [77.6300, 12.9700],
          [77.6500, 12.9700],
          [77.6500, 12.9900],
          [77.6300, 12.9900],
          [77.6300, 12.9700]
        ]
      ]
    },
    triggerThresholds: {
      rainMmPerHour: 20,
      heatTempCelsius: 40,
      aqiThreshold: 300,
      floodWaterLevelCm: 15
    },
    premiumBand: {
      Basic: 25,
      Standard: 45,
      Premium: 75
    }
  },
  {
    zoneName: 'Koramangala',
    city: 'Bengaluru',
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [
          [77.6100, 12.9200],
          [77.6350, 12.9200],
          [77.6350, 12.9450],
          [77.6100, 12.9450],
          [77.6100, 12.9200]
        ]
      ]
    },
    triggerThresholds: {
      rainMmPerHour: 18,
      heatTempCelsius: 40,
      aqiThreshold: 300,
      floodWaterLevelCm: 12
    },
    premiumBand: {
      Basic: 28,
      Standard: 50,
      Premium: 82
    }
  },
  {
    zoneName: 'Andheri',
    city: 'Mumbai',
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [
          [72.8200, 19.1000],
          [72.8700, 19.1000],
          [72.8700, 19.1400],
          [72.8200, 19.1400],
          [72.8200, 19.1000]
        ]
      ]
    },
    triggerThresholds: {
      rainMmPerHour: 22,
      heatTempCelsius: 38,
      aqiThreshold: 280,
      floodWaterLevelCm: 18
    },
    premiumBand: {
      Basic: 32,
      Standard: 58,
      Premium: 95
    }
  },
  {
    zoneName: 'Connaught Place',
    city: 'Delhi NCR',
    geoBoundary: {
      type: 'Polygon',
      coordinates: [
        [
          [77.2000, 28.6200],
          [77.2300, 28.6200],
          [77.2300, 28.6500],
          [77.2000, 28.6500],
          [77.2000, 28.6200]
        ]
      ]
    },
    triggerThresholds: {
      rainMmPerHour: 25,
      heatTempCelsius: 43,
      aqiThreshold: 350,
      floodWaterLevelCm: 10
    },
    premiumBand: {
      Basic: 30,
      Standard: 52,
      Premium: 88
    }
  }
];

const seedZones = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/gig_insured';
    console.log(`[Seed Script]: Connecting to MongoDB at ${mongoUri}...`);

    await mongoose.connect(mongoUri);
    console.log('[Seed Script]: MongoDB Connected successfully.');

    // Clear existing zones
    await ZoneConfig.deleteMany({});
    console.log('[Seed Script]: Cleared existing ZoneConfig documents.');

    // Insert seeded zones
    const createdZones = await ZoneConfig.insertMany(DEMO_ZONES);
    console.log(`\n==================================================`);
    console.log(`[Seed Script SUCCESS]: Seeded ${createdZones.length} ZoneConfig documents:`);
    createdZones.forEach(z => {
      console.log(` - ${z.zoneName} (${z.city}) | GeoJSON 2dsphere Polygon | Rain threshold: ${z.triggerThresholds.rainMmPerHour}mm/h`);
    });
    console.log(`==================================================\n`);

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Script Error]: ${error.message}`);
    // If DB is offline, print JSON seed schema for mock fallback
    console.log('\n[Seed Script Fallback]: MongoDB offline. Seed zones definition output below:');
    console.log(JSON.stringify(DEMO_ZONES, null, 2));
    process.exit(0);
  }
};

seedZones();
