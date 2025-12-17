const ImpersonationSession = require('../models/ImpersonationSession');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../middleware/auditLogger');

// Start impersonation session
const startImpersonation = async (req, res) => {
  try {
    const { targetUserId, reason } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required'
      });
    }

    // Don't allow impersonating yourself
    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot impersonate yourself'
      });
    }

    const targetUser = await User.findByPk(targetUserId, {
      attributes: { exclude: ['password'] }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // End any existing active session for this admin
    await ImpersonationSession.update(
      { isActive: false, endedAt: new Date() },
      {
        where: {
          adminUserId: req.user.id,
          isActive: true
        }
      }
    );

    // Create new session
    const session = await ImpersonationSession.create({
      adminUserId: req.user.id,
      targetUserId,
      reason: reason || null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      isActive: true
    });

    // Generate token for impersonated user
    const token = jwt.sign(
      { userId: targetUser.id, role: targetUser.role, impersonated: true, adminId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log the action
    await createAuditLog(
      req.user.id,
      'User Impersonation Started',
      'Security',
      {
        targetUserId,
        details: `Started impersonation session for ${targetUser.email}. Reason: ${reason || 'Not specified'}`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
      }
    );

    res.status(200).json({
      success: true,
      message: 'Impersonation session started',
      data: {
        session,
        targetUser,
        token
      }
    });
  } catch (error) {
    console.error('Start impersonation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting impersonation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// End impersonation session
const endImpersonation = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ImpersonationSession.findOne({
      where: {
        id: sessionId,
        adminUserId: req.user.id,
        isActive: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active impersonation session not found'
      });
    }

    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    // Log the action
    await createAuditLog(
      req.user.id,
      'User Impersonation Ended',
      'Security',
      {
        targetUserId: session.targetUserId,
        details: 'Ended impersonation session',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
      }
    );

    res.status(200).json({
      success: true,
      message: 'Impersonation session ended',
      data: session
    });
  } catch (error) {
    console.error('End impersonation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error ending impersonation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get impersonation sessions
const getImpersonationSessions = async (req, res) => {
  try {
    const { activeOnly = false } = req.query;

    const where = {};
    if (req.user.role !== 'admin') {
      where.adminUserId = req.user.id;
    }
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const sessions = await ImpersonationSession.findAll({
      where,
      include: [
        {
          model: User,
          as: 'adminUser',
          attributes: ['id', 'email']
        },
        {
          model: User,
          as: 'targetUser',
          attributes: ['id', 'email']
        }
      ],
      order: [['startedAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get impersonation sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching impersonation sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  startImpersonation,
  endImpersonation,
  getImpersonationSessions
};

