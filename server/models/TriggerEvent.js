const mongoose = require('mongoose');

const TriggerEventSchema = new mongoose.Schema(
  {
    zone: {
      type: String,
      required: [true, 'Disruption zone is required'],
      index: true,
      trim: true
    },
    disruptionType: {
      type: String,
      enum: {
        values: ['rain', 'heat', 'flood', 'AQI', 'curfew', 'strike'],
        message: '{VALUE} is not a valid disruption trigger type'
      },
      required: true,
      index: true
    },
    dataSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    confirmedAt: {
      type: Date
    },
    observationWindowStart: {
      type: Date,
      required: true,
      default: Date.now
    },
    signalsUsed: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'false-positive'],
      default: 'pending',
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  {
    timestamps: true
  }
);

TriggerEventSchema.index({ zone: 1, disruptionType: 1, status: 1 });

module.exports = mongoose.model('TriggerEvent', TriggerEventSchema);
