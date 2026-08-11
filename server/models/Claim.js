const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
      index: true
    },
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
      required: true,
      index: true
    },
    triggerEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TriggerEvent',
      required: true,
      index: true
    },
    hoursLost: {
      type: Number,
      required: true,
      min: 0,
      max: 24
    },
    payoutAmount: {
      type: Number,
      required: true,
      min: 0
    },
    fraudRiskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    claimState: {
      type: String,
      enum: {
        values: [
          'Detected',
          'Scoring',
          'Auto-Approved',
          'Under-Review',
          'Blocked',
          'Paid',
          'Appealed'
        ],
        message: '{VALUE} is not a valid claim state'
      },
      default: 'Detected',
      index: true
    },
    reason: {
      type: String,
      trim: true
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

ClaimSchema.index({ workerId: 1, claimState: 1 });

module.exports = mongoose.model('Claim', ClaimSchema);
