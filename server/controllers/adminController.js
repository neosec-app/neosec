// Import required modules for database operations and authentication
const { Op, fn, col } = require('sequelize');
const User = require('../models/User');
const VpnConfig = require('../models/VpnConfig');
const Threat = require('../models/Threat');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('../middleware/auditLogger');

// Helper function to build database filters based on role, approval status, and search term
const buildUserFilters = (role, isApproved, search) => {
  const whereClause = {};

  // Filter by role
  if (role && role !== 'all') {
    whereClause.role = role;
  }

  // Filter by approval status
  if (isApproved !== undefined && isApproved !== null) {
    whereClause.isApproved = isApproved === 'true' || isApproved === true;
  }

  // Search filter (email, name, phone)
  if (search) {
    whereClause[Op.or] = [
      { email: { [Op.iLike]: `%${search}%` } },
      { name: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } }
    ];
  }

  return whereClause;
};

// Helper function to calculate pagination parameters from page number and items per page
const buildPaginationParams = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const offset = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
};

// Helper function to format pagination information for API response
const formatPaginationResponse = (count, page, limit) => {
  return {
    total: count,
    page: page,
    limit: limit,
    totalPages: Math.ceil(count / limit)
  };
};

// Main function to retrieve all users with filtering, pagination, and sorting
const getAllUsers = async (req, res) => {
  try {
    // Extract query parameters for filtering and pagination
    const {
      page = 1,
      limit = 50,
      role,
      isApproved,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Calculate pagination offset and limit
    const pagination = buildPaginationParams(page, limit);

    // Build database query filters
    const whereClause = buildUserFilters(role, isApproved, search);

    // Set sorting order for results
    const order = [[sortBy, sortOrder.toUpperCase()]];

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: order,
      limit: pagination.limit,
      offset: pagination.offset
    });

    res.status(200).json({
      success: true,
      count: count,
      data: {
        users: rows,
        pagination: formatPaginationResponse(count, pagination.page, pagination.limit)
      }
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

// Function to retrieve a single user by their ID with related VPN and threat information
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

// Function to update user information with role and approval status management
const updateUser = async (req, res) => {
  try {
    // Extract update data from request body
    const { email, role, isApproved } = req.body;
    const userId = req.params.id;

    // Find the user to update
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent users from changing their own admin role
    if (userId === req.user.id && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role'
      });
    }

    // Check if the current user is the main admin
    const isMainAdmin = req.user.email === 'admin@test.com';

    // Only main admin can demote other admins
    if (role !== undefined && role !== 'admin') {
      if (user.role === 'admin') {
        if (!isMainAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You cannot demote another admin. Only the main admin can demote other admins.'
          });
        }
        // Prevent main admin from demoting themselves
        if (userId === req.user.id) {
          return res.status(400).json({
            success: false,
            message: 'You cannot demote yourself, even as the main admin'
          });
        }
      }
    }

    // Apply updates to user fields
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isApproved !== undefined) user.isApproved = isApproved;

    // Save changes to database
    await user.save();

    // Record the update action in audit log
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

// Function to delete a user account with safety checks
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent users from deleting their own account
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

    // Record deletion action in audit log before removing user
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

// Function to gather and return system-wide statistics for admin dashboard
const getStatistics = async (req, res) => {
  try {
    // Count total users and users by role
    const totalUsers = await User.count();
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalRegularUsers = await User.count({ where: { role: 'user' } });
    const pendingApprovals = await User.count({ where: { isApproved: false } });

    // Count VPN configurations
    const totalVpnConfigs = await VpnConfig.count();
    const activeVpnConfigs = await VpnConfig.count({ where: { isActive: true } });

    // Count blocked threats
    const totalThreats = await Threat.count({ where: { blocked: true } });
    
    // Calculate date for last 24 hours
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

    // Group threats by severity level
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

