const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
      index: true
    },
    tier: {
      type: String,
      required: [true, 'Policy tier is required'],
      enum: ['Basic', 'Standard', 'Premium'],
      default: 'Standard'
    },
    weeklyPremium: {
      type: Number,
      required: true,
      min: 0
    },
    weeklyBenefitCap: {
      type: Number,
      required: true,
      min: 0
    },
    coveragePeriodStart: {
      type: Date,
      required: true,
      default: Date.now
    },
    coveragePeriodEnd: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Disruption Detected', 'Payout Initiated', 'Expired', 'Cancelled'],
        message: '{VALUE} is not a valid policy status'
      },
      default: 'Active',
      index: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient active policy lookup by worker
PolicySchema.index({ workerId: 1, status: 1 });

module.exports = mongoose.model('Policy', PolicySchema);
