// Automatic threat blocker scheduler
const cron = require('node-cron');
const BlocklistIP = require('../models/BlocklistIP');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const abuseIPDBService = require('../services/abuseIPDBService');

let scheduledJob = null;
let updateFrequency = 'daily'; // 'realtime', 'hourly', '6hours', 'daily'

/**
 * Update blocklist from AbuseIPDB
 */
async function updateBlocklist() {
  try {
    const apiKey = process.env.ABUSEIPDB_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  ABUSEIPDB_API_KEY not configured. Skipping automatic blocklist update.');
      return;
    }

    console.log('🔄 Starting automatic blocklist update...');
    
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
    try {
      await ActivityLog.create({
        eventType: 'Blocklist Update',
        description: `Automatic blocklist update: ${addedCount} new IPs added, ${updatedCount} IPs updated`,
        status: 'Success',
        severity: 'info',
        userId: null, // System update
        metadata: {
          addedCount,
          updatedCount,
          totalFetched: blocklistData.length
        }
      });
    } catch (logError) {
      console.error('Error logging blocklist update:', logError);
    }

    // Create notification for admins if significant update
    if (addedCount > 100) {
      try {
        const admins = await User.findAll({ where: { role: 'admin' } });
        for (const admin of admins) {
          await Notification.create({
            title: 'Blocklist Updated Automatically',
            message: `${addedCount} new threats added to blocklist`,
            eventType: 'blocklist_updated',
            priority: 'medium',
            severity: 'info',
            userId: admin.id
          });
        }
      } catch (notifError) {
        console.error('Error creating notifications:', notifError);
      }
    }

    console.log(`✅ Automatic blocklist update completed: ${addedCount} added, ${updatedCount} updated`);
  } catch (error) {
    console.error('❌ Automatic blocklist update failed:', error.message);
    
    // Log error activity
    try {
      await ActivityLog.create({
        eventType: 'Blocklist Update',
        description: `Automatic blocklist update failed: ${error.message}`,
        status: 'Failed',
        severity: 'critical',
        userId: null,
        metadata: { error: error.message }
      });
    } catch (logError) {
      console.error('Error logging blocklist update failure:', logError);
    }
  }
}

/**
 * Start scheduled updates based on frequency
 */
function startScheduler(frequency = 'daily') {
  // Stop existing job if any
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }

  updateFrequency = frequency;

  // Define cron schedules
  const schedules = {
    'realtime': '*/5 * * * *',      // Every 5 minutes
    'hourly': '0 * * * *',          // Every hour
    '6hours': '0 */6 * * *',        // Every 6 hours
    'daily': '0 2 * * *'            // Daily at 2 AM
  };

  const cronSchedule = schedules[frequency] || schedules['daily'];

  console.log(`📅 Starting threat blocker scheduler with frequency: ${frequency} (${cronSchedule})`);

  // Run immediately on start (for testing)
  updateBlocklist().catch(console.error);

  // Schedule recurring updates
  scheduledJob = cron.schedule(cronSchedule, () => {
    console.log(`⏰ Scheduled blocklist update triggered (${frequency})`);
    updateBlocklist().catch(console.error);
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  return scheduledJob;
}

/**
 * Stop scheduled updates
 */
function stopScheduler() {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    console.log('🛑 Threat blocker scheduler stopped');
  }
}

/**
 * Get current scheduler status
 */
function getSchedulerStatus() {
  return {
    isRunning: scheduledJob !== null,
    frequency: updateFrequency
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  updateBlocklist
};

