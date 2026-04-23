'use strict';
/**
 * routes/api.js
 * ClearScore — shared / analytics API routes
 *
 * Mounted at /api in app.js
 *
 * NOTE: Auth endpoints are handled by routes/auth.js (/api/auth/*)
 *       Loan CRUD is handled by routes/loan.js (/api/loan/*)
 *       Admin endpoints are handled by routes/admin.js (/api/admin/*)
 *       Analyst endpoints are handled by routes/analyst.js (/api/analyst/*)
 *
 * This file keeps:
 *   GET  /api/auth/token           — exchange Passport session → JWT
 *   POST /api/loans                — submit loan + ML predict (legacy)
 *   GET  /api/loans                — list loans
 *   GET  /api/loans/:id/risk       — risk details for a loan
 *   PATCH /api/loans/:id/status    — update loan status (Analyst/Admin)
 *   POST /api/analytics/whatif     — what-if simulator
 *   GET  /api/analytics/fairness   — fairness metrics
 *   GET  /api/analytics/drift      — drift detection
 *   GET  /api/analytics/model-info — model metadata
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');
const LoanApplication = require('../models/LoanApplication');
const RiskPrediction = require('../models/RiskPrediction');
const { generateToken, verifyToken, requireRole } = require('../middleware/rbac');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// ──────────────────────────────────────────────
// SESSION → JWT TOKEN EXCHANGE
// ──────────────────────────────────────────────

// GET /api/auth/token — Exchange passport session for JWT
router.get('/auth/token', async (req, res) => {
  if (req.isAuthenticated() && req.user) {
    const token = generateToken(req.user);
    return res.json({ token, role: req.user.role });
  }
  return res.status(401).json({ error: 'Not authenticated in session.' });
});

// ──────────────────────────────────────────────
// LOAN ENDPOINTS (legacy / generic)
// ──────────────────────────────────────────────

// POST /api/loans — Submit a Loan Application (Borrower, Analyst, Admin)
router.post('/loans', verifyToken, requireRole(['Borrower', 'Analyst', 'Admin']), async (req, res) => {
  try {
    const { incomeAnnual, loanAmount, employmentLength, creditHistoryAge, homeOwnershipStatus, lgd, ead } = req.body;

    const loanApp = new LoanApplication({
      userId: req.userAuth.id,
      incomeAnnual,
      loanAmount,
      employmentLength,
      creditHistoryAge,
      homeOwnershipStatus,
      lgd,
      ead,
      status: 'pending'
    });
    await loanApp.save();

    const payload = {
      income_annual: incomeAnnual,
      loan_amount: loanAmount,
      employment_length: employmentLength,
      credit_history_age: creditHistoryAge,
      home_ownership_status: homeOwnershipStatus,
      lgd,
      ead
    };

    const mlResponse = await axios.post(`${FASTAPI_URL}/predict`, payload);
    const mlData = mlResponse.data;

    const riskPred = new RiskPrediction({
      loanApplicationId: loanApp._id,
      modelPdScore: mlData.model_pd_score,
      modelRiskGrade: mlData.model_risk_grade,
      expectedLoss: mlData.expected_loss,
      shapValues: mlData.shap_values,
      shapBaseValue: mlData.shap_base_value,
      limeValues: mlData.lime_values,
      limeLabels: mlData.lime_labels,
      counterfactuals: mlData.counterfactuals || [],
      modelVersion: mlData.model_version,
      xaiRecommendation: mlData.xai_comparison ? mlData.xai_comparison.recommendation : 'SHAP',
      modelComparison: mlData.model_comparison || {},
      xaiComparison: mlData.xai_comparison || {},
      featureNames: mlData.feature_names || [],
      predictionTimestamp: mlData.prediction_timestamp
    });
    await riskPred.save();

    res.status(201).json({ loanApp, riskPred });
  } catch (error) {
    console.error('Error submitting loan:', error.message);
    res.status(500).json({ error: 'Failed to process application.' });
  }
});

// GET /api/loans — Get Loan Applications
router.get('/loans', verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.userAuth.role === 'Borrower') {
      query.userId = req.userAuth.id;
    }

    const loans = await LoanApplication.find(query).sort({ createdAt: -1 });
    res.json({ loans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loans.' });
  }
});

// GET /api/loans/:id/risk — Get Risk Prediction details
router.get('/loans/:id/risk', verifyToken, async (req, res) => {
  try {
    const loan = await LoanApplication.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    if (req.userAuth.role === 'Borrower' && loan.userId.toString() !== req.userAuth.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const riskPred = await RiskPrediction.findOne({ loanApplicationId: loan._id });
    res.json({ loan, riskPred });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch risk details.' });
  }
});

// PATCH /api/loans/:id/status — Update loan status (Analyst, Admin)
router.patch('/loans/:id/status', verifyToken, requireRole(['Analyst', 'Admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'denied', 'overridden'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const loan = await LoanApplication.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    res.json({ loan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update loan status.' });
  }
});

// ──────────────────────────────────────────────
// ANALYTICS ENDPOINTS
// ──────────────────────────────────────────────

// POST /api/analytics/whatif — What-If Simulator
router.post('/analytics/whatif', verifyToken, requireRole(['Borrower', 'Analyst', 'Admin']), async (req, res) => {
  try {
    const { incomeAnnual, loanAmount, employmentLength, creditHistoryAge, homeOwnershipStatus, lgd, ead } = req.body;

    const payload = {
      income_annual: incomeAnnual,
      loan_amount: loanAmount,
      employment_length: employmentLength,
      credit_history_age: creditHistoryAge,
      home_ownership_status: homeOwnershipStatus,
      lgd,
      ead
    };

    const mlResponse = await axios.post(`${FASTAPI_URL}/whatif`, payload);
    res.json(mlResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to run what-if simulator.' });
  }
});

// GET /api/analytics/fairness — Fairness Metrics (Analyst, Admin)
router.get('/analytics/fairness', verifyToken, requireRole(['Analyst', 'Admin']), async (req, res) => {
  try {
    const mlResponse = await axios.get(`${FASTAPI_URL}/fairness`);
    res.json(mlResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fairness metrics.' });
  }
});

// GET /api/analytics/drift — Drift Detection (Analyst, Admin)
router.get('/analytics/drift', verifyToken, requireRole(['Analyst', 'Admin']), async (req, res) => {
  try {
    const mlResponse = await axios.get(`${FASTAPI_URL}/drift`);
    res.json(mlResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drift metrics.' });
  }
});

// GET /api/analytics/model-info — Model metadata
router.get('/analytics/model-info', verifyToken, async (req, res) => {
  try {
    const mlResponse = await axios.get(`${FASTAPI_URL}/model-info`);
    res.json(mlResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch model info.' });
  }
});

module.exports = router;
