const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  incomeAnnual: {
    type: Number,
    required: true,
    min: 0
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  employmentLength: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  creditHistoryAge: {
    type: Number,
    required: true,
    min: 0
  },
  homeOwnershipStatus: {
    type: String,
    enum: ['RENT', 'OWN', 'MORTGAGE', 'OTHER'],
    required: true
  },
  occupationType: {
    type: String,
    enum: ['salaried', 'gig', 'freelance', 'self-employed'],
    required: true
  },
  geographyTier: {
    type: String,
    enum: ['Tier-1', 'Tier-2', 'Tier-3'],
    required: true
  },
  existingEMI: {
    type: Number,
    default: 0,
    min: 0
  },
  lgd: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  ead: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);