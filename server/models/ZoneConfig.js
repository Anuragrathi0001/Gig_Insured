const mongoose = require('mongoose');

const ZoneConfigSchema = new mongoose.Schema(
  {
    zoneName: {
      type: String,
      required: [true, 'Zone name is required'],
      unique: true,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      index: true,
      trim: true
    },
    geoBoundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
        default: 'Polygon'
      },
      coordinates: {
        type: [[[Number]]], // Array of linear rings containing [longitude, latitude] arrays
        required: true
      }
    },
    triggerThresholds: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {
        rainMmPerHour: 35,
        heatTempCelsius: 42,
        aqiThreshold: 350,
        floodWaterLevelCm: 15
      }
    },
    premiumBand: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {
        Basic: 25,
        Standard: 45,
        Premium: 75
      }
    }
  },
  {
    timestamps: true
  }
);

// Geospatial 2dsphere index for spatial queries (e.g., matching delivery worker location to zone)
ZoneConfigSchema.index({ geoBoundary: '2dsphere' });

module.exports = mongoose.model('ZoneConfig', ZoneConfigSchema);
