const express = require('express');
const router = express.Router();
const axios = require('axios');
const LoanApplication = require('../models/LoanApplication');
const RiskPrediction = require('../models/RiskPrediction');
const AuditLog = require('../models/AuditLog');
const { authenticate } = require('../middleware/auth');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// @route   POST /api/loan/apply
router.post('/apply', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      incomeAnnual,
      loanAmount,
      employmentLength,
      creditHistoryAge,
      homeOwnershipStatus,
      occupationType,
      geographyTier,
      existingEMI,
      creditInvisible
    } = req.body;

    if (!incomeAnnual || !loanAmount || employmentLength === undefined) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Create loan application - set EAD manually
    const application = new LoanApplication({
      userId,
      incomeAnnual,
      loanAmount,
      employmentLength,
      creditHistoryAge: creditHistoryAge || 0,
      homeOwnershipStatus,
      occupationType,
      geographyTier,
      existingEMI: existingEMI || 0,
      ead: loanAmount,  // Set EAD manually
      lgd: 0.5
    });

    await application.save();

    // Try to call ML service (but don't fail if it's not running)
    // In routes/loan.js - update the ML service call section
      let predictionData;
      try {
        console.log('Calling ML service at:', FASTAPI_URL);
        const mlResponse = await axios.post(`${FASTAPI_URL}/predict`, {
          income_annual: incomeAnnual,
          loan_amount: loanAmount,
          employment_length: employmentLength,
          credit_history_age: creditHistoryAge || 0,
          home_ownership_status: homeOwnershipStatus,
          occupation_type: occupationType,
          geography_tier: geographyTier,
          existing_emi: existingEMI || 0,
          credit_invisible: creditInvisible || false
        });
        predictionData = mlResponse.data;
        console.log('ML service response received');
      } catch (mlError) {
        // Show the actual error
        console.error('ML service error details:', mlError.message);
        if (mlError.code === 'ECONNREFUSED') {
          console.log('❌ ML service is NOT running on port 8000');
        } else if (mlError.response) {
          console.log('❌ ML service returned error:', mlError.response.status, mlError.response.data);
        }
        console.log('Using mock prediction instead');
        
        // Mock prediction
        predictionData = {
          model_pd_score: 0.25,
          model_risk_grade: 'B',
          expected_loss: loanAmount * 0.5 * 0.25,
          shap_values: {},
          roadmap: {},
          model_version: 'mock'
        };
      }

    // Store risk prediction
    const riskPrediction = new RiskPrediction({
      applicationId: application._id,
      modelPdScore: predictionData.model_pd_score,
      modelRiskGrade: predictionData.model_risk_grade,
      expectedLoss: predictionData.expected_loss,
      shapValues: predictionData.shap_values || {},
      roadmap: predictionData.roadmap || {},
      modelVersion: predictionData.model_version || '1.0.0'
    });

    await riskPrediction.save();

    res.status(201).json({
      application,
      prediction: riskPrediction
    });

  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/loan/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const applications = await LoanApplication.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const predictions = await RiskPrediction.find({
      applicationId: { $in: applications.map(a => a._id) }
    }).lean();

    const predictionMap = {};
    predictions.forEach(p => {
      predictionMap[p.applicationId.toString()] = p;
    });

    const history = applications.map(app => ({
      ...app,
      prediction: predictionMap[app._id.toString()] || null
    }));

    res.json({ applications: history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;