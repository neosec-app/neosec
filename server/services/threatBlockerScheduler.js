// Automatic threat blocker scheduler
const cron = require('node-cron');
const BlocklistIP = require('../models/BlocklistIP');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const abuseIPDBService = require('../services/abuseIPDBService');
const freeBlocklistService = require('../services/freeBlocklistService');

let scheduledJob = null;
let updateFrequency = 'daily'; // 'realtime', 'hourly', '6hours', 'daily'

/**
 * Update blocklist from AbuseIPDB
 */
async function updateBlocklist() {
  try {
    const apiKey = process.env.ABUSEIPDB_API_KEY;
    const useFreeSources = process.env.USE_FREE_BLOCKLIST_SOURCES !== 'false'; // Default to true
    
    // Debug logging for environment variables
    console.log('🔍 Blocklist source configuration:');
    console.log(`   - ABUSEIPDB_API_KEY: ${apiKey ? '✅ Set (' + apiKey.substring(0, 8) + '...)' : '❌ NOT SET'}`);
    console.log(`   - USE_FREE_BLOCKLIST_SOURCES: ${useFreeSources ? '✅ Enabled' : '❌ Disabled'}`);
    
    if (!apiKey && !useFreeSources) {
      console.warn('⚠️  No blocklist sources configured. Set ABUSEIPDB_API_KEY or USE_FREE_BLOCKLIST_SOURCES=true');
      return;
    }

    console.log('🔄 Starting automatic blocklist update...');
    
    let blocklistData = [];
    let sourceUsed = '';

    // Fetch from free sources (no API key needed)
    if (useFreeSources) {
      try {
        const freeSources = ['blocklist.de'];
        if (process.env.INCLUDE_TOR_EXIT_NODES === 'true') {
          freeSources.push('tor');
        }
        blocklistData = await freeBlocklistService.fetchFreeBlocklist(freeSources);
        sourceUsed = 'Free Sources';
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
        
        console.log(`🔄 Fetching from AbuseIPDB (maxAge: ${maxAgeInDays} days, confidence: ${confidenceMinimum}%, limit: ${limit})`);
        
        const abuseIPDBData = await abuseIPDBService.fetchBlocklist(
          apiKey,
          maxAgeInDays,
          confidenceMinimum,
          limit
        );
        
        if (abuseIPDBData && abuseIPDBData.length > 0) {
          // Merge with free sources (deduplicate)
          const existingIPs = new Set(blocklistData.map(ip => ip.ipAddress));
          for (const ipData of abuseIPDBData) {
            if (!existingIPs.has(ipData.ipAddress)) {
              blocklistData.push(ipData);
              existingIPs.add(ipData.ipAddress);
            }
          }
          sourceUsed = sourceUsed ? `${sourceUsed} + AbuseIPDB` : 'AbuseIPDB';
          console.log(`✅ Added ${abuseIPDBData.length} IPs from AbuseIPDB (total: ${blocklistData.length})`);
        } else {
          console.log('⚠️  AbuseIPDB returned no data (empty response)');
        }
      } catch (abuseError) {
        console.error('❌ AbuseIPDB fetch failed:', abuseError.message);
        if (abuseError.response) {
          console.error('   Response status:', abuseError.response.status);
          console.error('   Response data:', JSON.stringify(abuseError.response.data));
        }
      }
    } else {
      console.log('⚠️  AbuseIPDB API key not set - skipping AbuseIPDB fetch');
      console.log('   💡 To enable AbuseIPDB, set ABUSEIPDB_API_KEY environment variable in your hosting platform');
    }
    
    if (!blocklistData || blocklistData.length === 0) {
      console.warn('⚠️  No blocklist data received from any source');
      return;
    }

    let addedCount = 0;
    let updatedCount = 0;

    // Limit the number of IPs to process (to reduce CPU load)
    const maxIPsToProcess = parseInt(process.env.THREAT_BLOCKER_MAX_IPS || '500', 10);
    const batchSize = parseInt(process.env.THREAT_BLOCKER_BATCH_SIZE || '50', 10);
    const delayBetweenBatches = parseInt(process.env.THREAT_BLOCKER_BATCH_DELAY || '100', 10); // milliseconds

    // Limit total IPs to process
    const limitedBlocklistData = blocklistData.slice(0, maxIPsToProcess);
    if (blocklistData.length > maxIPsToProcess) {
      console.log(`⚠️  Limiting processing to ${maxIPsToProcess} IPs (${blocklistData.length} total available)`);
    }

    // Process in batches to reduce CPU load
    for (let i = 0; i < limitedBlocklistData.length; i += batchSize) {
      const batch = limitedBlocklistData.slice(i, i + batchSize);
      
      // Process batch
      for (const ipData of batch) {
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

      // Add delay between batches to reduce CPU load
      if (i + batchSize < limitedBlocklistData.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
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

  // Run immediately on start only if enabled via env var (disabled by default to reduce CPU load)
  if (process.env.THREAT_BLOCKER_RUN_ON_START === 'true') {
    updateBlocklist().catch(console.error);
  } else {
    console.log('⏸️  Skipping initial blocklist update (set THREAT_BLOCKER_RUN_ON_START=true to enable)');
  }

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

