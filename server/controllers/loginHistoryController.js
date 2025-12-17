const LoginHistory = require('../models/LoginHistory');
const User = require('../models/User');
const { Op } = require('sequelize');

// Get login history
const getLoginHistory = async (req, res) => {
  try {
    const { userId, success, suspicious, page = 1, limit = 50 } = req.query;

    const where = {};
    
    // Admin can view any user's history, regular users can only view their own
    if (req.user.role === 'admin' && userId) {
      where.userId = userId;
    } else {
      where.userId = req.user.id;
    }

    if (success !== undefined) {
      where.success = success === 'true';
    }

    if (suspicious !== undefined && suspicious === 'true') {
      where.suspiciousActivity = true;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const total = await LoginHistory.count({ where });

    const history = await LoginHistory.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching login history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get security events (failed logins, suspicious activity)
const getSecurityEvents = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const events = await LoginHistory.findAll({
      where: {
        [Op.or]: [
          { success: false },
          { suspiciousActivity: true }
        ],
        createdAt: {
          [Op.gte]: startDate
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get statistics
    const stats = {
      totalFailed: await LoginHistory.count({
        where: {
          success: false,
          createdAt: { [Op.gte]: startDate }
        }
      }),
      totalSuspicious: await LoginHistory.count({
        where: {
          suspiciousActivity: true,
          createdAt: { [Op.gte]: startDate }
        }
      }),
      uniqueIPs: await LoginHistory.count({
        where: {
          [Op.or]: [
            { success: false },
            { suspiciousActivity: true }
          ],
          createdAt: { [Op.gte]: startDate }
        },
        distinct: true,
        col: 'ipAddress'
      })
    };

    res.status(200).json({
      success: true,
      data: events,
      stats
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching security events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Lock/unlock user account (admin only)
const toggleUserLock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { locked } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow locking yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot lock your own account'
      });
    }

    user.isApproved = !locked;
    await user.save();

    // Log the action
    const { createAuditLog } = require('../middleware/auditLogger');
    await createAuditLog(
      req.user.id,
      locked ? 'Account Locked' : 'Account Unlocked',
      'Security',
      {
        targetUserId: userId,
        details: `${locked ? 'Locked' : 'Unlocked'} user account`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
      }
    );

    res.status(200).json({
      success: true,
      message: `Account ${locked ? 'locked' : 'unlocked'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Toggle user lock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling user lock',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getLoginHistory,
  getSecurityEvents,
  toggleUserLock
};

