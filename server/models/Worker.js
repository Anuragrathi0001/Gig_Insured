const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Worker name is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      index: true,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      index: true,
      trim: true
    },
    zone: {
      type: String,
      required: [true, 'Zone is required'],
      index: true,
      trim: true
    },
    platform: {
      type: String,
      enum: {
        values: ['Zomato', 'Swiggy'],
        message: '{VALUE} is not a supported gig platform'
      },
      required: [true, 'Gig platform is required']
    },
    workerId: {
      type: String,
      required: [true, 'Platform Worker ID is required'],
      unique: true,
      trim: true
    },
    avgWeeklyIncome: {
      type: Number,
      default: 0,
      min: 0
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    riskProfile: {
      zoneRiskScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
      },
      weatherExposureScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
      }
    },
    upiId: {
      type: String,
      required: [true, 'UPI ID is required for automated payouts'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Worker', WorkerSchema);
