const mongoose = require('mongoose');

const FraudFlagSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
      index: true
    },
    signalType: {
      type: String,
      enum: {
        values: ['gps-spoofing', 'fake-weather', 'coordinated-ring', 'duplicate'],
        message: '{VALUE} is not a recognized fraud signal type'
      },
      required: true,
      index: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FraudFlag', FraudFlagSchema);
