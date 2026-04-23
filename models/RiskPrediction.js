const mongoose = require('mongoose');

const riskPredictionSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication',
    required: true
  },
  modelPdScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  modelRiskGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  expectedLoss: {
    type: Number,
    required: true,
    min: 0
  },
  shapValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  roadmap: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  predictionTimestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RiskPrediction', riskPredictionSchema);