const mongoose = require('mongoose');

const shadowProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rentPaymentScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  utilityScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  employmentType: {
    type: String,
    enum: ['salaried', 'gig', 'freelance', 'self-employed'],
    required: true
  },
  savingsRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  mobileBillScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  shadowGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  shadowConfidence: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  firstStepRecommendation: {
    type: String,
    required: true
  },
  shadowPd: {
    type: Number,
    min: 0,
    max: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShadowProfile', shadowProfileSchema);