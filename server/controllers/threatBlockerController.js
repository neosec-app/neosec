const BlocklistIP = require('../models/BlocklistIP');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Op } = require('sequelize');
const abuseIPDBService = require('../services/abuseIPDBService');

/**
 * Get threat blocker status and statistics
 */
exports.getStatus = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // Get last update time
    const lastUpdate = await BlocklistIP.findOne({
      order: [['updatedAt', 'DESC']],
      attributes: ['updatedAt']
    });

    // Get total IPs in blocklist
    const totalIPs = await BlocklistIP.count();

    // Get threats blocked today (count of distinct IPs that were blocked today)
    // Note: This would typically come from ActivityLog, but for now we'll count blocklist entries
    let blockedToday = 0;
    let blockedThisWeek = 0;
    try {
      blockedToday = await ActivityLog.count({
        where: {
          eventType: 'Blocked Threat',
          status: 'Blocked',
          createdAt: {
            [Op.gte]: todayStart
          }
        }
      });

      // Get threats blocked this week
      blockedThisWeek = await ActivityLog.count({
        where: {
          eventType: 'Blocked Threat',
          status: 'Blocked',
          createdAt: {
            [Op.gte]: weekStart
          }
        }
      });
    } catch (logError) {
      // If ActivityLog table doesn't exist yet, use 0
      console.warn('ActivityLog table might not exist yet:', logError.message);
    }

    // Get unique sources
    const sources = await BlocklistIP.findAll({
      attributes: ['source'],
      group: ['source'],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        enabled: true, // Could be stored in settings table
        lastUpdate: lastUpdate ? lastUpdate.updatedAt : null,
        totalIPs,
        blockedToday,
        blockedThisWeek,
        sources: sources.map(s => s.source),
        updateFrequency: 'daily' // Could be from settings
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // If table doesn't exist, return empty status instead of error
    if (error.name === 'SequelizeDatabaseError' && 
        (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table'))) {
      console.warn('Table blocklist_ips does not exist yet. Please restart the server to create tables.');
      return res.status(200).json({
        success: true,
        data: {
          enabled: false,
          lastUpdate: null,
          totalIPs: 0,
          blockedToday: 0,
          blockedThisWeek: 0,
          sources: [],
          updateFrequency: 'daily'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch threat blocker status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get blocklist with pagination and filters
 */
exports.getBlocklist = async (req, res) => {
  try {

    const {
      page = 1,
      limit = 50,
      search,
      threatType,
      source,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    if (search) {
      // Search only in ipAddress field (ENUM fields don't support iLike properly)
      whereClause.ipAddress = { [Op.iLike]: `%${search}%` };
    }

    if (threatType && threatType !== 'all') {
      whereClause.threatType = threatType;
    }

    if (source && source !== 'all') {
      whereClause.source = source;
    }

    // Build where clause properly - handle empty whereClause
    const queryOptions = {
      where: Object.keys(whereClause).length > 0 ? whereClause : {},
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset
    };

    const { count, rows } = await BlocklistIP.findAndCountAll(queryOptions);

    res.status(200).json({
      success: true,
      data: {
        blocklist: rows || [],
        pagination: {
          total: count || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((count || 0) / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get blocklist error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // If table doesn't exist, return empty result instead of error
    if (error.name === 'SequelizeDatabaseError' && 
        (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table'))) {
      console.warn('Table blocklist_ips does not exist yet. Please restart the server to create tables.');
      return res.status(200).json({
        success: true,
        data: {
          blocklist: [],
          pagination: {
            total: 0,
            page: parseInt(req.query.page || 1),
            limit: parseInt(req.query.limit || 50),
            totalPages: 0
          }
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch blocklist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Force update blocklist from AbuseIPDB
 */
exports.forceUpdate = async (req, res) => {
  try {
    const apiKey = process.env.ABUSEIPDB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'AbuseIPDB API key not configured'
      });
    }

    // Fetch blocklist from AbuseIPDB
    const blocklistData = await abuseIPDBService.fetchBlocklist(apiKey);

    let addedCount = 0;
    let updatedCount = 0;

    for (const ipData of blocklistData) {
      const [blocklistIP, created] = await BlocklistIP.findOrCreate({
        where: { ipAddress: ipData.ipAddress },
        defaults: {
          ipAddress: ipData.ipAddress,
          threatType: ipData.threatType,
          source: ipData.source,
          confidence: ipData.abuseConfidenceScore,
          country: ipData.countryCode,
          countryName: null,
          lastSeen: ipData.lastReportedAt ? new Date(ipData.lastReportedAt) : new Date(),
          abuseConfidenceScore: ipData.abuseConfidenceScore,
          usageType: ipData.usageType,
          isp: ipData.isp,
          domain: ipData.domain,
          hostnames: ipData.hostnames,
          totalReports: ipData.totalReports,
          numDistinctUsers: ipData.numDistinctUsers
        }
      });

      if (!created) {
        // Update existing record
        await blocklistIP.update({
          threatType: ipData.threatType,
          source: ipData.source,
          confidence: ipData.abuseConfidenceScore,
          country: ipData.countryCode,
          lastSeen: ipData.lastReportedAt ? new Date(ipData.lastReportedAt) : new Date(),
          abuseConfidenceScore: ipData.abuseConfidenceScore,
          usageType: ipData.usageType,
          isp: ipData.isp,
          domain: ipData.domain,
          hostnames: ipData.hostnames,
          totalReports: ipData.totalReports,
          numDistinctUsers: ipData.numDistinctUsers
        });
        updatedCount++;
      } else {
        addedCount++;
      }
    }

    // Log activity
    await ActivityLog.create({
      eventType: 'Blocklist Update',
      description: `Blocklist updated: ${addedCount} new IPs added, ${updatedCount} IPs updated`,
      status: 'Success',
      severity: 'info',
      userId: req.user ? req.user.id : null,
      metadata: {
        addedCount,
        updatedCount,
        totalFetched: blocklistData.length
      }
    });

    // Create notification for admins if significant update
    if (addedCount > 100) {
      const admins = await User.findAll({ where: { role: 'admin' } });
      for (const admin of admins) {
        await Notification.create({
          title: 'Blocklist Updated',
          message: `${addedCount} new threats added to blocklist`,
          eventType: 'blocklist_updated',
          priority: 'medium',
          severity: 'info',
          userId: admin.id
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Blocklist updated successfully',
      data: {
        added: addedCount,
        updated: updatedCount,
        total: blocklistData.length,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Force update error:', error);

    // Log error activity
    await ActivityLog.create({
      eventType: 'Blocklist Update',
      description: `Blocklist update failed: ${error.message}`,
      status: 'Failed',
      severity: 'critical',
      userId: req.user ? req.user.id : null,
      metadata: { error: error.message }
    }).catch(console.error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update blocklist'
    });
  }
};

/**
 * Get statistics
 */
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - 7));

    const totalIPs = await BlocklistIP.count();

    const blockedToday = await ActivityLog.count({
      where: {
        eventType: 'Blocked Threat',
        status: 'Blocked',
        createdAt: { [Op.gte]: todayStart }
      }
    });

    const blockedThisWeek = await ActivityLog.count({
      where: {
        eventType: 'Blocked Threat',
        status: 'Blocked',
        createdAt: { [Op.gte]: weekStart }
      }
    });

    // Get threat type distribution
    const threatTypes = await BlocklistIP.findAll({
      attributes: [
        'threatType',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['threatType'],
      raw: true
    });

    // Get source distribution
    const sources = await BlocklistIP.findAll({
      attributes: [
        'source',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['source'],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        totalIPs,
        blockedToday,
        blockedThisWeek,
        threatTypeDistribution: threatTypes,
        sourceDistribution: sources
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

/**
 * Update settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { updateFrequency, autoApply, enabled } = req.body;
    const { startScheduler, stopScheduler } = require('../services/threatBlockerScheduler');
    
    // Update scheduler if frequency changed
    if (updateFrequency) {
      if (enabled !== false) {
        startScheduler(updateFrequency);
        console.log(`Threat blocker scheduler updated to: ${updateFrequency}`);
      } else {
        stopScheduler();
        console.log('Threat blocker scheduler stopped (disabled)');
      }
    }
    
    // Store settings (in a real app, you'd save to a settings table)
    // For now, we'll use environment variable or just log
    if (updateFrequency) {
      process.env.THREAT_BLOCKER_UPDATE_FREQUENCY = updateFrequency;
    }
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        updateFrequency: updateFrequency || 'daily',
        autoApply: autoApply !== false,
        enabled: enabled !== false
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Export blocklist
 */
exports.exportBlocklist = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    const blocklist = await BlocklistIP.findAll({
      order: [['createdAt', 'DESC']]
    });

    if (format === 'json') {
      res.status(200).json({
        success: true,
        data: blocklist
      });
    } else {
      // CSV format
      const csvHeader = 'IP Address,Threat Type,Source,Confidence,Country,Last Seen,Total Reports\n';
      const csvRows = blocklist.map(ip => 
        `"${ip.ipAddress}","${ip.threatType}","${ip.source}",${ip.confidence || 0},"${ip.country || ''}","${ip.lastSeen || ''}",${ip.totalReports || 0}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=blocklist.csv');
      res.send(csvHeader + csvRows);
    }
  } catch (error) {
    console.error('Export blocklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export blocklist'
    });
  }
};

