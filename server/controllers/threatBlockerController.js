const BlocklistIP = require('../models/BlocklistIP');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Threat = require('../models/Threat');
const ThreatBlockerSettings = require('../models/ThreatBlockerSettings');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');
const abuseIPDBService = require('../services/abuseIPDBService');
const freeBlocklistService = require('../services/freeBlocklistService');
const { getSchedulerStatus } = require('../services/threatBlockerScheduler');

// Helper function to get setting value
async function getSetting(key, defaultValue) {
  try {
    // Check if table exists first
    const tableExists = await ThreatBlockerSettings.sequelize.getQueryInterface().tableExists(ThreatBlockerSettings.tableName);
    if (!tableExists) {
      return defaultValue;
    }
    
    const setting = await ThreatBlockerSettings.findOne({ where: { key } });
    if (setting && setting.value !== null) {
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(setting.value);
      } catch {
        return setting.value;
      }
    }
    return defaultValue;
  } catch (error) {
    // If table doesn't exist or other error, return default
    if (error.name === 'SequelizeDatabaseError' && 
        (error.message?.includes('does not exist') || error.message?.includes('relation'))) {
      return defaultValue;
    }
    console.warn(`Error getting setting ${key}:`, error.message);
    return defaultValue;
  }
}

// Helper function to set setting value
async function setSetting(key, value) {
  try {
    // Check if table exists first, if not, create it
    const tableExists = await ThreatBlockerSettings.sequelize.getQueryInterface().tableExists(ThreatBlockerSettings.tableName);
    if (!tableExists) {
      // Try to sync the table
      await ThreatBlockerSettings.sync();
    }
    
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const [setting] = await ThreatBlockerSettings.findOrCreate({
      where: { key },
      defaults: { key, value: stringValue }
    });
    if (!setting.isNewRecord) {
      await setting.update({ value: stringValue });
    }
    return setting;
  } catch (error) {
    console.error(`Error setting ${key}:`, error.message);
    // Don't throw error, just log it - allow the request to continue
    return null;
  }
}

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

    // Get actual scheduler status dynamically
    const schedulerStatus = getSchedulerStatus();
    
    // Get settings from database
    const enabled = await getSetting('enabled', schedulerStatus.isRunning);
    const updateFrequency = await getSetting('updateFrequency', schedulerStatus.frequency || 'daily');
    const autoApply = await getSetting('autoApply', true);
    const notificationsEnabled = await getSetting('notificationsEnabled', true);

    res.status(200).json({
      success: true,
      data: {
        enabled: enabled !== false && schedulerStatus.isRunning,
        lastUpdate: lastUpdate ? lastUpdate.updatedAt : null,
        totalIPs,
        blockedToday,
        blockedThisWeek,
        sources: sources.map(s => s.source),
        updateFrequency: updateFrequency || schedulerStatus.frequency || 'daily',
        autoApply: autoApply !== false,
        notificationsEnabled: notificationsEnabled !== false
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
      // Get scheduler status even if table doesn't exist
      const schedulerStatus = getSchedulerStatus();
      return res.status(200).json({
        success: true,
        data: {
          enabled: false,
          lastUpdate: null,
          totalIPs: 0,
          blockedToday: 0,
          blockedThisWeek: 0,
          sources: [],
          updateFrequency: schedulerStatus.frequency || 'daily',
          autoApply: true,
          notificationsEnabled: true
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
    const useFreeSources = process.env.USE_FREE_BLOCKLIST_SOURCES !== 'false'; // Default to true
    
    let blocklistData = [];
    let sourceUsed = '';

    // Try free sources first (no API key needed)
    if (useFreeSources) {
      try {
        console.log('🔄 Fetching from FREE blocklist sources (Blocklist.de, Tor Exit Nodes)...');
        const freeSources = ['blocklist.de'];
        if (process.env.INCLUDE_TOR_EXIT_NODES === 'true') {
          freeSources.push('tor');
        }
        
        blocklistData = await freeBlocklistService.fetchFreeBlocklist(freeSources);
        sourceUsed = 'Free Sources (Blocklist.de)';
        
        if (blocklistData.length > 0) {
          console.log(`✅ Fetched ${blocklistData.length} IPs from free sources`);
        }
      } catch (freeError) {
        console.warn('⚠️  Free blocklist fetch failed:', freeError.message);
      }
    }

    // If AbuseIPDB API key is available, also fetch from there
    if (apiKey) {
      try {
        const maxAgeInDays = parseInt(process.env.ABUSEIPDB_MAX_AGE_DAYS || '90', 10);
        const confidenceMinimum = parseInt(process.env.ABUSEIPDB_CONFIDENCE_MIN || '75', 10);
        const limit = parseInt(process.env.ABUSEIPDB_LIMIT || '10000', 10);
        
        console.log(`🔄 Also fetching from AbuseIPDB (maxAge: ${maxAgeInDays} days, confidence: ${confidenceMinimum}%, limit: ${limit})`);
        
        const abuseIPDBData = await abuseIPDBService.fetchBlocklist(
          apiKey,
          maxAgeInDays,
          confidenceMinimum,
          limit
        );
        
        if (abuseIPDBData && abuseIPDBData.length > 0) {
          // Merge with free sources (deduplicate by IP)
          const existingIPs = new Set(blocklistData.map(ip => ip.ipAddress));
          for (const ipData of abuseIPDBData) {
            if (!existingIPs.has(ipData.ipAddress)) {
              blocklistData.push(ipData);
              existingIPs.add(ipData.ipAddress);
            }
          }
          sourceUsed = sourceUsed ? `${sourceUsed} + AbuseIPDB` : 'AbuseIPDB';
          console.log(`✅ Added ${abuseIPDBData.length} IPs from AbuseIPDB (total: ${blocklistData.length})`);
        }
      } catch (abuseError) {
        console.warn('⚠️  AbuseIPDB fetch failed:', abuseError.message);
        // Continue with free sources if available
      }
    } else if (blocklistData.length === 0) {
      // No API key and no free sources data
      return res.status(200).json({
        success: true,
        message: 'Using free blocklist sources. Set ABUSEIPDB_API_KEY for additional threat data.',
        data: {
          added: 0,
          updated: 0,
          total: 0,
          updatedAt: new Date(),
          source: 'Free Sources (no data yet)'
        }
      });
    }
    
    if (!Array.isArray(blocklistData) || blocklistData.length === 0) {
      console.warn('⚠️  No blocklist data received from any source');
      return res.status(200).json({
        success: true,
        message: 'No new threats found to add',
        data: {
          added: 0,
          updated: 0,
          total: 0,
          updatedAt: new Date()
        }
      });
    }

    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    console.log(`📝 Processing ${blocklistData.length} IPs...`);
    
    for (const ipData of blocklistData) {
      try {
        if (!ipData || !ipData.ipAddress) {
          console.warn('⚠️  Skipping invalid IP data:', ipData);
          errorCount++;
          continue;
        }
        
        const [blocklistIP, created] = await BlocklistIP.findOrCreate({
          where: { ipAddress: ipData.ipAddress },
          defaults: {
            ipAddress: ipData.ipAddress,
            threatType: ipData.threatType || 'Other',
            source: ipData.source || 'AbuseIPDB',
            confidence: ipData.abuseConfidenceScore || 0,
            country: ipData.countryCode || null,
            countryName: null,
            lastSeen: ipData.lastReportedAt ? new Date(ipData.lastReportedAt) : new Date(),
            abuseConfidenceScore: ipData.abuseConfidenceScore || 0,
            usageType: ipData.usageType || null,
            isp: ipData.isp || null,
            domain: ipData.domain || null,
            hostnames: ipData.hostnames || [],
            totalReports: ipData.totalReports || 0,
            numDistinctUsers: ipData.numDistinctUsers || 0
          }
        });

        if (!created) {
          // Update existing record
          await blocklistIP.update({
            threatType: ipData.threatType || blocklistIP.threatType,
            source: ipData.source || blocklistIP.source,
            confidence: ipData.abuseConfidenceScore || blocklistIP.confidence,
            country: ipData.countryCode || blocklistIP.country,
            lastSeen: ipData.lastReportedAt ? new Date(ipData.lastReportedAt) : blocklistIP.lastSeen,
            abuseConfidenceScore: ipData.abuseConfidenceScore || blocklistIP.abuseConfidenceScore,
            usageType: ipData.usageType || blocklistIP.usageType,
            isp: ipData.isp || blocklistIP.isp,
            domain: ipData.domain || blocklistIP.domain,
            hostnames: ipData.hostnames || blocklistIP.hostnames,
            totalReports: ipData.totalReports || blocklistIP.totalReports,
            numDistinctUsers: ipData.numDistinctUsers || blocklistIP.numDistinctUsers
          });
          updatedCount++;
        } else {
          addedCount++;
        }
      } catch (ipError) {
        console.error(`❌ Error processing IP ${ipData?.ipAddress}:`, ipError.message);
        errorCount++;
        // Continue processing other IPs
      }
    }
    
    console.log(`✅ Processed: ${addedCount} added, ${updatedCount} updated, ${errorCount} errors`);

    // Log activity
    try {
      await ActivityLog.create({
        eventType: 'Blocklist Update',
        description: `Blocklist updated: ${addedCount} new IPs added, ${updatedCount} IPs updated${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
        status: errorCount > 0 ? 'Partial Success' : 'Success',
        severity: 'info',
        userId: req.user ? req.user.id : null,
        metadata: {
          addedCount,
          updatedCount,
          errorCount,
          totalFetched: blocklistData.length
        }
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Don't fail the request if logging fails
    }

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
      message: `Blocklist updated successfully from ${sourceUsed || 'Free Sources'}`,
      data: {
        added: addedCount,
        updated: updatedCount,
        total: blocklistData.length,
        updatedAt: new Date(),
        source: sourceUsed || 'Free Sources'
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
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

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
    const { updateFrequency, autoApply, enabled, notificationsEnabled } = req.body;
    const { startScheduler, stopScheduler } = require('../services/threatBlockerScheduler');
    
    // Store settings in database
    if (updateFrequency !== undefined) {
      await setSetting('updateFrequency', updateFrequency);
    }
    if (autoApply !== undefined) {
      await setSetting('autoApply', autoApply);
    }
    if (enabled !== undefined) {
      await setSetting('enabled', enabled);
    }
    if (notificationsEnabled !== undefined) {
      await setSetting('notificationsEnabled', notificationsEnabled);
    }
    
    // Get current settings to determine what to update
    const currentEnabled = await getSetting('enabled', true);
    const currentFrequency = await getSetting('updateFrequency', 'daily');
    
    // Determine final values
    const finalEnabled = enabled !== undefined ? enabled !== false : currentEnabled !== false;
    const finalFrequency = updateFrequency || currentFrequency;
    
    // Update scheduler based on enabled status and frequency
    if (finalEnabled) {
      startScheduler(finalFrequency);
      console.log(`✅ Threat blocker scheduler started (frequency: ${finalFrequency})`);
    } else {
      stopScheduler();
      console.log('🛑 Threat blocker scheduler stopped (disabled)');
    }
    
    // Also update environment variable for backward compatibility
    if (updateFrequency) {
      process.env.THREAT_BLOCKER_UPDATE_FREQUENCY = updateFrequency;
    }
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        updateFrequency: finalFrequency,
        autoApply: autoApply !== undefined ? autoApply !== false : await getSetting('autoApply', true),
        enabled: finalEnabled,
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled !== false : await getSetting('notificationsEnabled', true)
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
 * Test threat blocker by simulating a blocked IP request
 * This creates a test threat entry for demonstration
 */
exports.testThreatBlocker = async (req, res) => {
  try {
    // Get a random IP from the blocklist to test with
    const testIP = await BlocklistIP.findOne({
      order: [Sequelize.literal('RANDOM()')],
      limit: 1
    });

    if (!testIP) {
      return res.status(400).json({
        success: false,
        message: 'No IPs in blocklist to test with. Please update the blocklist first.'
      });
    }

    // Create a test threat entry
    // Use current user's ID if available, otherwise use admin
    let threatUserId = req.user ? req.user.id : null;
    
    if (!threatUserId) {
      const User = require('../models/User');
      const admin = await User.findOne({ 
        where: { role: 'admin' },
        attributes: ['id'],
        limit: 1
      });
      if (admin) {
        threatUserId = admin.id;
      } else {
        return res.status(500).json({
          success: false,
          message: 'No user found to associate threat with'
        });
      }
    }

    // Map threat type
    const threatTypeMap = {
      'Malware C&C': 'malware',
      'Botnet': 'malware',
      'Brute Force': 'intrusion',
      'Malware Host': 'malware',
      'Phishing': 'phishing',
      'DDoS': 'ddos',
      'Spam': 'suspicious',
      'Exploit': 'intrusion',
      'Suspicious': 'suspicious',
      'Other': 'other'
    };

    // Create test threat
    const testThreat = await Threat.create({
      threatType: threatTypeMap[testIP.threatType] || 'other',
      sourceIp: testIP.ipAddress,
      description: `[TEST] Simulated blocked threat IP: ${testIP.ipAddress} (${testIP.threatType}) from ${testIP.source}`,
      severity: testIP.abuseConfidenceScore >= 90 ? 'critical' : 
               testIP.abuseConfidenceScore >= 75 ? 'high' : 
               testIP.abuseConfidenceScore >= 50 ? 'medium' : 'low',
      blocked: true,
      userId: threatUserId
    });

    // Also create ActivityLog entry
    await ActivityLog.create({
      eventType: 'Blocked Threat',
      description: `[TEST] Simulated blocked request from threat IP: ${testIP.ipAddress} (${testIP.threatType})`,
      status: 'Blocked',
      severity: 'critical',
      userId: threatUserId,
      ipAddress: testIP.ipAddress,
      metadata: {
        threatType: testIP.threatType,
        source: testIP.source,
        confidence: testIP.abuseConfidenceScore,
        blocklistId: testIP.id,
        isTest: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Test threat created successfully',
      data: {
        threat: testThreat,
        testIP: testIP.ipAddress,
        threatType: testIP.threatType
      }
    });
  } catch (error) {
    console.error('Test threat blocker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test threat',
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

