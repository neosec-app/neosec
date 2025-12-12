const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { Op } = require('sequelize');

// Get audit logs with filters
const getAuditLogs = async (req, res) => {
  try {
    const {
      dateRange = '7days',
      category,
      adminUserId,
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Calculate date range
    let startDate;
    const endDate = new Date();
    
    switch (dateRange) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    // Build where clause
    const where = {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (adminUserId && adminUserId !== 'all') {
      where.adminUserId = adminUserId;
    }

    if (search) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${search}%` } },
        { details: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get total count
    const total = await AuditLog.count({ where });

    // Get logs with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const logs = await AuditLog.findAll({
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
          attributes: ['id', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Get statistics
    const stats = {
      totalActions: total,
      successCount: await AuditLog.count({
        where: { ...where, result: 'success' }
      }),
      failureCount: await AuditLog.count({
        where: { ...where, result: 'failure' }
      }),
      activeAdmins: await AuditLog.count({
        where,
        distinct: true,
        col: 'adminUserId'
      }),
      criticalActions: await AuditLog.count({
        where: { ...where, category: 'Security' }
      })
    };

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export audit logs
const exportAuditLogs = async (req, res) => {
  try {
    const { format = 'csv', dateRange = '7days', entryIds } = req.body;

    // Calculate date range (same logic as getAuditLogs)
    let startDate;
    const endDate = new Date();
    
    switch (dateRange) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    const where = {
      createdAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    if (entryIds && entryIds.length > 0) {
      where.id = { [Op.in]: entryIds };
    }

    const logs = await AuditLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'adminUser',
          attributes: ['email']
        },
        {
          model: User,
          as: 'targetUser',
          attributes: ['email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Timestamp,Admin User,Action,Target User,Details,Category,IP Address,Result\n';
      const csvRows = logs.map(log => {
        const timestamp = new Date(log.createdAt).toISOString();
        const adminEmail = log.adminUser?.email || 'N/A';
        const targetEmail = log.targetUser?.email || 'N/A';
        const details = (log.details || '').replace(/"/g, '""');
        return `"${timestamp}","${adminEmail}","${log.action}","${targetEmail}","${details}","${log.category}","${log.ipAddress || 'N/A'}","${log.result}"`;
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`);
      res.send(csvHeader + csvRows);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.json`);
      res.json({
        success: true,
        exportedAt: new Date().toISOString(),
        count: logs.length,
        data: logs
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export format. Use csv or json'
      });
    }
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAuditLogs,
  exportAuditLogs
};

