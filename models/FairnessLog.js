const mongoose = require('mongoose');

const fairnessLogSchema = new mongoose.Schema({
  modelVersion: {
    type: String,
    required: true
  },
  groupMetrics: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  overallApprovalRate: {
    type: Number,
    required: true
  },
  demographicParityDifferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  equalOpportunityDifferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  biasAlerts: [{
    attribute: String,
    group: String,
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH']
    },
    difference: Number
  }],
  intersectionalApprovalRates: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  flaggedCombinations: [{
    combination: String,
    approvalRate: Number,
    overallRate: Number,
    severity: String
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FairnessLog', fairnessLogSchema);