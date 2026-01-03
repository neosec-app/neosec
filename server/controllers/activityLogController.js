// Import models for activity log management
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Device = require('../models/Device');
const { Op } = require('sequelize');

// Helper function to build user filter based on role and permissions
const buildUserFilter = async (currentUser, userId, userRole) => {
  const whereClause = {};

  // Filter by user (if not admin, only show their logs)
  if (currentUser.role !== 'admin') {
    whereClause.userId = currentUser.id;
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

  return whereClause;
};

// Helper function to build date range filter for log queries
const buildDateRangeFilter = (startDate, endDate) => {
  const filter = {};
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt[Op.lte] = new Date(endDate);
    }
  }
  
  return filter;
};

// Helper function to build filters for event type, severity, and status
const buildEventFilters = (eventType, severity, status) => {
  const filter = {};

  // Valid ENUM values from ActivityLog model
  const validEventTypes = [
    'VPN Connection', 'VPN Disconnection', 'Blocked Threat', 'System Event',
    'Notification', 'Firewall Rule Update', 'Profile Activation', 'Profile Deactivation',
    'Blocklist Update', 'User Action', 'Other'
  ];
  const validStatuses = ['Success', 'Failed', 'Blocked', 'Disconnected', 'Pending'];
  const validSeverities = ['critical', 'warning', 'info'];

  // Event type filter - trim and validate
  if (eventType && eventType !== 'all') {
    const trimmedEventType = eventType.trim();
    if (validEventTypes.includes(trimmedEventType)) {
      filter.eventType = trimmedEventType;
    }
  }

  // Severity filter - trim and validate
  if (severity && severity !== 'all') {
    const trimmedSeverity = severity.trim();
    if (validSeverities.includes(trimmedSeverity)) {
      filter.severity = trimmedSeverity;
    }
  }

  // Status filter - trim and validate (this was causing the error!)
  if (status && status !== 'all') {
    const trimmedStatus = status.trim();
    if (validStatuses.includes(trimmedStatus)) {
      filter.status = trimmedStatus;
    }
  }

  return filter;
};

// Helper function to build search filter for description and IP address
const buildSearchFilter = (search) => {
  if (!search) return {};

  return {
    [Op.or]: [
      { description: { [Op.iLike]: `%${search}%` } },
      { ipAddress: { [Op.iLike]: `%${search}%` } }
    ]
  };
};

// Helper function to calculate pagination parameters
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

// Helper function to format pagination information for response
const formatPaginationResponse = (count, page, limit) => {
  return {
    total: count,
    page: page,
    limit: limit,
    totalPages: Math.ceil(count / limit)
  };
};

// Main function to retrieve activity logs with filtering, pagination, and sorting
exports.getLogs = async (req, res) => {
  try {
    // Decode URL-encoded query parameters (handles spaces like "Blocked Threat")
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

    // Decode eventType if it contains URL-encoded spaces
    const decodedEventType = eventType ? decodeURIComponent(eventType) : eventType;

    // Build pagination parameters
    const pagination = buildPaginationParams(page, limit);

    // Build user filter
    const userFilter = await buildUserFilter(req.user, userId, userRole);

    // Build date range filter
    const dateFilter = buildDateRangeFilter(startDate, endDate);

    // Build event filters (use decoded eventType)
    const eventFilters = buildEventFilters(decodedEventType, severity, status);

    // Build search filter
    const searchFilter = buildSearchFilter(search);

    // Combine all filters
    const whereClause = {
      ...userFilter,
      ...dateFilter,
      ...eventFilters,
      ...searchFilter
    };

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['createdAt', 'eventType', 'severity', 'status', 'description'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let count, rows;
    try {
      ({ count, rows } = await ActivityLog.findAndCountAll({
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
        order: [[safeSortBy, safeSortOrder]],
        limit: pagination.limit,
        offset: pagination.offset
      }));
    } catch (dbError) {
      console.error('Database query error:', dbError);
      console.error('Query whereClause:', JSON.stringify(whereClause, null, 2));
      throw dbError;
    }

    res.status(200).json({
      success: true,
      data: {
        logs: rows,
        pagination: formatPaginationResponse(count, pagination.page, pagination.limit)
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

// Function to retrieve a single activity log entry by ID
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

// Function to create a new activity log entry, typically called by other services
exports.createLog = async (data) => {
  try {
    const log = await ActivityLog.create(data);
    return log;
  } catch (error) {
    console.error('Create log error:', error);
    throw error;
  }
};

// Function to export activity logs in CSV or JSON format
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

