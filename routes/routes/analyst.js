const express = require('express');
const router = express.Router();
const axios = require('axios');
const LoanApplication = require('../models/LoanApplication');
const RiskPrediction = require('../models/RiskPrediction');
const FairnessLog = require('../models/FairnessLog');
const AuditLog = require('../models/AuditLog');
const { authenticate, authorize } = require('../middleware/auth');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://ml_service:8000';

// Audit log helper
const logAudit = async (userId, action, details, req) => {
  try {
    await AuditLog.create({
      userId,
      action,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// @route   GET /api/analyst/portfolio
// @desc    Get portfolio analytics (PD distribution, EL trends, model comparison)
// @access  Private (Analyst, Admin)
router.get('/portfolio', authenticate, authorize(['Analyst', 'Admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const query = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter } 
      : {};

    // Get all predictions
    const predictions = await RiskPrediction.find(query)
      .populate('applicationId')
      .lean();

    // Calculate PD distribution
    const pdBrackets = {
      '0-10%': 0,
      '10-20%': 0,
      '20-30%': 0,
      '30-40%': 0,
      '40-50%': 0,
      '50-60%': 0,
      '60-70%': 0,
      '70-80%': 0,
      '80-90%': 0,
      '90-100%': 0
    };

    predictions.forEach(p => {
      const pd = p.modelPdScore;
      if (pd < 0.1) pdBrackets['0-10%']++;
      else if (pd < 0.2) pdBrackets['10-20%']++;
      else if (pd < 0.3) pdBrackets['20-30%']++;
      else if (pd < 0.4) pdBrackets['30-40%']++;
      else if (pd < 0.5) pdBrackets['40-50%']++;
      else if (pd < 0.6) pdBrackets['50-60%']++;
      else if (pd < 0.7) pdBrackets['60-70%']++;
      else if (pd < 0.8) pdBrackets['70-80%']++;
      else if (pd < 0.9) pdBrackets['80-90%']++;
      else pdBrackets['90-100%']++;
    });

    // Calculate EL trends over time
    const elTrends = {};
    predictions.forEach(p => {
      const date = p.createdAt.toISOString().split('T')[0];
      if (!elTrends[date]) {
        elTrends[date] = { total: 0, count: 0 };
      }
      elTrends[date].total += p.expectedLoss;
      elTrends[date].count++;
    });

    const elTrendArray = Object.entries(elTrends).map(([date, data]) => ({
      date,
      avgExpectedLoss: data.total / data.count,
      applicationCount: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Model performance comparison (from stored predictions)
    const modelVersions = [...new Set(predictions.map(p => p.modelVersion))];
    const modelComparison = modelVersions.map(version => {
      const versionPreds = predictions.filter(p => p.modelVersion === version);
      const avgPd = versionPreds.reduce((sum, p) => sum + p.modelPdScore, 0) / versionPreds.length;
      
      return {
        version,
        predictionCount: versionPreds.length,
        averagePd: avgPd,
        gradeDistribution: {
          A: versionPreds.filter(p => p.modelRiskGrade === 'A').length,
          B: versionPreds.filter(p => p.modelRiskGrade === 'B').length,
          C: versionPreds.filter(p => p.modelRiskGrade === 'C').length,
          D: versionPreds.filter(p => p.modelRiskGrade === 'D').length
        }
      };
    });

    // Summary statistics
    const totalApplications = predictions.length;
    const averagePd = predictions.reduce((sum, p) => sum + p.modelPdScore, 0) / totalApplications;
    const totalExpectedLoss = predictions.reduce((sum, p) => sum + p.expectedLoss, 0);

    await logAudit(req.user.id, 'PORTFOLIO_VIEWED', {
      totalApplications,
      dateRange: { startDate, endDate }
    }, req);

    res.json({
      summary: {
        totalApplications,
        averagePd,
        totalExpectedLoss,
        dateRange: { startDate, endDate }
      },
      pdDistribution: pdBrackets,
      elTrends: elTrendArray,
      modelComparison,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Portfolio analytics error:', error);
    res.status(500).json({ error: 'Server error fetching portfolio analytics' });
  }
});

// @route   GET /api/analyst/fairness
// @desc    Get bias audit with severity flags
// @access  Private (Analyst, Admin)
router.get('/fairness', authenticate, authorize(['Analyst', 'Admin']), async (req, res) => {
  try {
    // Call FastAPI /fairness/report
    const mlResponse = await axios.get(`${FASTAPI_URL}/fairness/report`);
    const fairnessData = mlResponse.data;

    // Store in fairness log
    const fairnessLog = new FairnessLog({
      modelVersion: '1.0.0',
      groupMetrics: fairnessData.demographic_parity,
      overallApprovalRate: fairnessData.overall_approval_rate,
      demographicParityDifferences: fairnessData.demographic_parity,
      equalOpportunityDifferences: fairnessData.equal_opportunity,
      biasAlerts: fairnessData.bias_alerts?.map(alert => ({
        attribute: alert.attribute,
        group: alert.group,
        severity: alert.severity,
        difference: alert.difference
      })),
      intersectionalApprovalRates: fairnessData.intersectional_analysis?.approval_rates,
      flaggedCombinations: fairnessData.intersectional_analysis?.flagged_combinations
    });

    await fairnessLog.save();

    await logAudit(req.user.id, 'FAIRNESS_AUDIT_VIEWED', {
      biasAlertsCount: fairnessData.bias_alerts?.length || 0
    }, req);

    res.json(fairnessData);
  } catch (error) {
    console.error('Fairness audit error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'ML service unavailable. Please try again later.' 
      });
    }
    
    res.status(500).json({ error: 'Server error fetching fairness audit' });
  }
});

module.exports = router;