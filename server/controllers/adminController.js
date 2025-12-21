const { Op, fn, col } = require('sequelize');
const User = require('../models/User');
const VpnConfig = require('../models/VpnConfig');
const Threat = require('../models/Threat');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('../middleware/auditLogger');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: VpnConfig,
          as: 'vpnConfigs',
          attributes: ['id', 'name', 'isActive', 'protocol']
        },
        {
          model: Threat,
          as: 'threats',
          attributes: ['id', 'threatType', 'severity', 'blocked', 'createdAt'],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { email, role, isApproved } = req.body;
    const userId = req.params.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow updating the current admin user's role
    if (userId === req.user.id && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role'
      });
    }

    // Check if current user is the main admin (first admin - admin@test.com)
    const isMainAdmin = req.user.email === 'admin@test.com';

    // Prevent admins from demoting other admins (same level protection)
    // Only the main admin (admin@test.com) can demote other admins
    if (role !== undefined && role !== 'admin') {
      // If trying to change role to non-admin
      if (user.role === 'admin') {
        if (!isMainAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You cannot demote another admin. Only the main admin can demote other admins.'
          });
        }
        // Main admin can demote other admins, but not themselves
        if (userId === req.user.id) {
          return res.status(400).json({
            success: false,
            message: 'You cannot demote yourself, even as the main admin'
          });
        }
      }
    }

    // Update fields
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isApproved !== undefined) user.isApproved = isApproved;

    await user.save();

    // Log the action
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await createAuditLog(
      req.user.id,
      'User Updated',
      'User Management',
      {
        targetUserId: userId,
        details: `Updated user: ${email ? `email=${email}` : ''} ${role ? `role=${role}` : ''} ${isApproved !== undefined ? `isApproved=${isApproved}` : ''}`,
        ipAddress,
        userAgent
      }
    );

    // Return user without password
    const userData = user.toJSON();

    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log the action before deletion
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await createAuditLog(
      req.user.id,
      'User Deleted',
      'User Management',
      {
        targetUserId: userId,
        details: `Deleted user account: ${user.email}`,
        ipAddress,
        userAgent
      }
    );

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get admin statistics
// @route   GET /api/admin/statistics
// @access  Private/Admin
const getStatistics = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.count();
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalRegularUsers = await User.count({ where: { role: 'user' } });
    const pendingApprovals = await User.count({ where: { isApproved: false } });

    // Get total VPN configs
    const totalVpnConfigs = await VpnConfig.count();
    const activeVpnConfigs = await VpnConfig.count({ where: { isActive: true } });

    // Get total threats blocked
    const totalThreats = await Threat.count({ where: { blocked: true } });
    
    // Get threats in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const threatsLast24h = await Threat.count({
      where: {
        blocked: true,
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      }
    });

    // Get threats by severity
    const threatsBySeverity = await Threat.findAll({
      attributes: [
        'severity',
        [fn('COUNT', col('id')), 'count']
      ],
      where: { blocked: true },
      group: ['severity'],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          regularUsers: totalRegularUsers,
          pendingApprovals: pendingApprovals
        },
        vpn: {
          totalConfigs: totalVpnConfigs,
          activeConfigs: activeVpnConfigs
        },
        threats: {
          totalBlocked: totalThreats,
          last24Hours: threatsLast24h,
          bySeverity: threatsBySeverity
        },
        applicationHealth: {
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStatistics
};

