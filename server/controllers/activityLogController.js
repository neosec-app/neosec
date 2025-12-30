const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Device = require('../models/Device');
const { Op } = require('sequelize');

/**
 * Get activity logs with filters and pagination
 */
exports.getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      eventType,
      severity,
      status,
      search,
      startDate,
      endDate,
      userId,
      userRole,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    // Filter by user (if not admin, only show their logs)
    if (req.user.role !== 'admin') {
      whereClause.userId = req.user.id;
    } else if (userId) {
      // If specific userId is provided, use that (takes priority over role filter)
      whereClause.userId = userId;
    } else if (userRole && userRole !== 'all') {
      // Filter by user role if specified (admin only, and no specific userId)
      // Get all user IDs with the specified role
      const usersWithRole = await User.findAll({
        where: { role: userRole },
        attributes: ['id']
      });
      const userIds = usersWithRole.map(u => u.id);
      
      // Filter activity logs by user IDs
      if (userIds.length > 0) {
        whereClause.userId = { [Op.in]: userIds };
      } else {
        // No users with this role, return empty result
        whereClause.userId = { [Op.in]: [] };
      }
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    // Event type filter
    if (eventType && eventType !== 'all') {
      whereClause.eventType = eventType;
    }

    // Severity filter
    if (severity && severity !== 'all') {
      whereClause.severity = severity;
    }

    // Status filter
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { ipAddress: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'role'],
          required: false
        },
        {
          model: Device,
          as: 'device',
          attributes: ['id', 'deviceName', 'deviceId'],
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    });

    res.status(200).json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs'
    });
  }
};

/**
 * Get log by ID
 */
exports.getLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const whereClause = { id };

    // Non-admins can only see their own logs
    if (req.user.role !== 'admin') {
      whereClause.userId = req.user.id;
    }

    const log = await ActivityLog.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
          required: false
        },
        {
          model: Device,
          as: 'device',
          required: false
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Get log by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch log'
    });
  }
};

/**
 * Create activity log entry (typically called by other services)
 */
exports.createLog = async (data) => {
  try {
    const log = await ActivityLog.create(data);
    return log;
  } catch (error) {
    console.error('Create log error:', error);
    throw error;
  }
};

/**
 * Export logs
 */
exports.exportLogs = async (req, res) => {
  try {
    const {
      format = 'csv',
      eventType,
      severity,
      startDate,
      endDate
    } = req.query;

    const whereClause = {};

    // Filter by user (if not admin, only export their logs)
    if (req.user.role !== 'admin') {
      whereClause.userId = req.user.id;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    if (eventType && eventType !== 'all') {
      whereClause.eventType = eventType;
    }

    if (severity && severity !== 'all') {
      whereClause.severity = severity;
    }

    const logs = await ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (format === 'json') {
      res.status(200).json({
        success: true,
        data: logs
      });
    } else {
      // CSV format
      const csvHeader = 'Timestamp,Event Type,Description,IP Address,Status,Severity,User Email\n';
      const csvRows = logs.map(log => {
        const timestamp = log.createdAt ? new Date(log.createdAt).toISOString() : '';
        const userEmail = log.user ? log.user.email : '';
        return `"${timestamp}","${log.eventType}","${log.description.replace(/"/g, '""')}","${log.ipAddress || ''}","${log.status}","${log.severity}","${userEmail}"`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvHeader + csvRows);
    }
  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export logs'
    });
  }
};

// Clear logs functionality removed - logs are kept permanently

