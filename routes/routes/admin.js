const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const DriftLog = require('../models/DriftLog');
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

// @route   GET /api/admin/users
// @desc    Get all users with roles
// @access  Private (Admin only)
router.get('/users', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    await logAudit(req.user.id, 'USER_LIST_VIEWED', {
      page,
      limit,
      filters: { role, search }
    }, req);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('User list error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// @route   POST /api/admin/override
// @desc    Manual override of prediction/decision
// @access  Private (Admin only)
router.post('/override', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { applicationId, overrideType, reason, newValues } = req.body;

    if (!applicationId || !overrideType || !reason) {
      return res.status(400).json({ 
        error: 'Application ID, override type, and reason are required' 
      });
    }

    // Log the override in audit trail
    await logAudit(req.user.id, 'MANUAL_OVERRIDE', {
      applicationId,
      overrideType,
      reason,
      newValues,
      adminId: req.user.id
    }, req);

    // Note: Actual override logic would update the application/prediction
    // This is kept as audit-only per requirements

    res.json({
      message: 'Override logged successfully',
      override: {
        applicationId,
        overrideType,
        reason,
        timestamp: new Date().toISOString(),
        adminId: req.user.id
      }
    });
  } catch (error) {
    console.error('Override error:', error);
    res.status(500).json({ error: 'Server error processing override' });
  }
});

// @route   GET /api/admin/drift
// @desc    Get drift status with retraining flags
// @access  Private (Admin only)
router.get('/drift', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    // Call FastAPI /drift/status
    const mlResponse = await axios.get(`${FASTAPI_URL}/drift/status`);
    const driftData = mlResponse.data;

    // Store drift logs for each feature
    const driftLogs = [];
    for (const [feature, data] of Object.entries(driftData.features)) {
      const driftLog = new DriftLog({
        feature,
        driftScore: data.ks_statistic,
        severity: data.severity,
        interpretation: data.interpretation,
        trainingMean: data.training_mean,
        incomingMean: data.incoming_mean,
        pValue: data.p_value,
        retrainFlag: data.retrain_flag
      });
      await driftLog.save();
      driftLogs.push(driftLog);
    }

    await logAudit(req.user.id, 'DRIFT_STATUS_VIEWED', {
      highestSeverity: driftData.summary.highest_severity,
      driftedFeatures: driftData.summary.drifted_features
    }, req);

    res.json({
      ...driftData,
      storedLogs: driftLogs.map(log => log._id)
    });
  } catch (error) {
    console.error('Drift status error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'ML service unavailable. Please try again later.' 
      });
    }
    
    res.status(500).json({ error: 'Server error fetching drift status' });
  }
});

// @route   GET /api/admin/audit
// @desc    Get full immutable audit trail
// @access  Private (Admin only)
router.get('/audit', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      userId, 
      action,
      startDate,
      endDate 
    } = req.query;

    const query = {};
    
    if (userId) query.userId = userId;
    if (action) query.action = action;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await AuditLog.countDocuments(query);

    // Get unique actions for filtering
    const uniqueActions = await AuditLog.distinct('action');

    await logAudit(req.user.id, 'AUDIT_TRAIL_VIEWED', {
      page,
      limit,
      filters: { userId, action, startDate, endDate }
    }, req);

    res.json({
      logs: auditLogs,
      filters: {
        availableActions: uniqueActions
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Audit trail error:', error);
    res.status(500).json({ error: 'Server error fetching audit trail' });
  }
});

// @route   PATCH /api/admin/users/:userId/role
// @desc    Update user role
// @access  Private (Admin only)
router.patch('/users/:userId/role', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['Borrower', 'Analyst', 'Admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAudit(req.user.id, 'USER_ROLE_UPDATED', {
      targetUserId: userId,
      newRole: role
    }, req);

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Server error updating role' });
  }
});

module.exports = router;