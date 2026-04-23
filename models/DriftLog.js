const mongoose = require('mongoose');

const driftLogSchema = new mongoose.Schema({
  feature: {
    type: String,
    required: true
  },
  driftScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  severity: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    required: true
  },
  interpretation: {
    type: String,
    required: true
  },
  trainingMean: {
    type: Number
  },
  incomingMean: {
    type: Number
  },
  pValue: {
    type: Number
  },
  retrainFlag: {
    type: Boolean,
    default: false
  },
  detectionTimestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DriftLog', driftLogSchema);