// Middleware to check incoming requests against threat blocklist
const BlocklistIP = require('../models/BlocklistIP');
const ActivityLog = require('../models/ActivityLog');
const Threat = require('../models/Threat');
const ThreatBlockerSettings = require('../models/ThreatBlockerSettings');
const { getClientIP, isLocalOrPrivateIP } = require('../utils/ipUtils');

// In-memory cache for blocklist IPs (loaded once, used for all requests)
let blocklistCache = new Set(); // Fast O(1) lookup
let blocklistCacheLoaded = false;
let blocklistCacheTimestamp = null;
const CACHE_REFRESH_INTERVAL = 60 * 60 * 1000; // Refresh cache every hour (as backup)

// Load blocklist into memory cache
async function loadBlocklistCache() {
  try {
    const ips = await BlocklistIP.findAll({
      attributes: ['ipAddress', 'threatType', 'source', 'abuseConfidenceScore'],
      raw: true
    });
    
    blocklistCache = new Set(ips.map(ip => ip.ipAddress));
    blocklistCacheLoaded = true;
    blocklistCacheTimestamp = new Date();
    
    console.log(`✅ Blocklist cache loaded: ${blocklistCache.size} IPs in memory`);
    return blocklistCache.size;
  } catch (error) {
    console.error('Error loading blocklist cache:', error);
    blocklistCacheLoaded = false;
    return 0;
  }
}

// Initialize cache on module load (will retry if database not ready)
// This is a best-effort attempt - cache will also load after database connects
loadBlocklistCache().catch(err => {
  // Silently fail on initial load - cache will load after DB is ready
  // This prevents errors if middleware loads before database connection
});

// Refresh cache periodically (backup in case scheduler doesn't trigger refresh)
setInterval(() => {
  if (blocklistCacheLoaded) {
    const age = Date.now() - blocklistCacheTimestamp.getTime();
    if (age > CACHE_REFRESH_INTERVAL) {
      console.log('🔄 Refreshing blocklist cache (periodic refresh)...');
      loadBlocklistCache().catch(console.error);
    }
  }
}, CACHE_REFRESH_INTERVAL);

// Export function to refresh cache (called by scheduler after updates)
function refreshBlocklistCache() {
  console.log('🔄 Refreshing blocklist cache (scheduler update)...');
  return loadBlocklistCache();
}

// Cache table existence check to avoid repeated queries
let tableExistsCache = null;
let tableExistsChecked = false;

// Helper to check if threat blocker is enabled
async function isThreatBlockerEnabled() {
  try {
    // Check table existence only once (cache it)
    if (!tableExistsChecked) {
      try {
        tableExistsCache = await ThreatBlockerSettings.sequelize.getQueryInterface().tableExists(ThreatBlockerSettings.tableName);
        tableExistsChecked = true;
      } catch (checkError) {
        tableExistsCache = false;
        tableExistsChecked = true;
      }
    }
    
    if (!tableExistsCache) {
      return true; // Default to enabled if table doesn't exist
    }
    
    const setting = await ThreatBlockerSettings.findOne({ where: { key: 'enabled' } });
    if (setting && setting.value !== null) {
      try {
        return JSON.parse(setting.value);
      } catch {
        return setting.value === 'true' || setting.value === true;
      }
    }
    // Default to enabled if no setting exists
    return true;
  } catch (error) {
    // If error, default to enabled for safety
    if (error.name === 'SequelizeDatabaseError' && 
        (error.message?.includes('does not exist') || error.message?.includes('relation'))) {
      return true; // Default to enabled if table doesn't exist
    }
    console.warn('Error checking threat blocker enabled status:', error.message);
    return true;
  }
}

/**
 * Middleware to block requests from IPs in the threat blocklist
 * This should be added early in the middleware chain
 */
const threatBlockerMiddleware = async (req, res, next) => {
  try {
    // Check if threat blocker is enabled
    const enabled = await isThreatBlockerEnabled();
    if (!enabled) {
      return next(); // Skip blocking if disabled
    }
    // Skip blocking for health checks, auth routes, and threat blocker routes (to avoid blocking legitimate admin access)
    const skipRoutes = [
      '/api/health', 
      '/api/auth/login', 
      '/api/auth/register',
      '/api/threat-blocker' // Allow access to threat blocker routes
    ];
    if (skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Get client IP address
    const clientIP = getClientIP(req);
    
    if (!clientIP || clientIP === 'unknown') {
      return next();
    }

    // Skip blocking for localhost and private IPs (development/testing)
    if (isLocalOrPrivateIP(clientIP)) {
      return next();
    }

    // Check if IP is in blocklist using in-memory cache (fast O(1) lookup)
    // If cache not loaded yet, fallback to database query
    let isBlocked = false;
    let blockedIP = null;
    
    if (blocklistCacheLoaded && blocklistCache.has(clientIP)) {
      // IP is in cache (blocked) - get full details from database only when needed
      isBlocked = true;
      // Get full IP details for logging (only when actually blocked)
      blockedIP = await BlocklistIP.findOne({
        where: { ipAddress: clientIP }
      });
    } else if (!blocklistCacheLoaded) {
      // Fallback: if cache not loaded, check database (shouldn't happen normally)
      blockedIP = await BlocklistIP.findOne({
        where: { ipAddress: clientIP }
      });
      isBlocked = !!blockedIP;
    }

    if (isBlocked && blockedIP) {
      // Log the blocked attempt
      try {
        // Create ActivityLog entry
        await ActivityLog.create({
          eventType: 'Blocked Threat',
          description: `Blocked request from threat IP: ${clientIP} (${blockedIP.threatType})`,
          status: 'Blocked',
          severity: 'critical',
          userId: req.user ? req.user.id : null, // Use user ID if available
          ipAddress: clientIP,
          metadata: {
            threatType: blockedIP.threatType,
            source: blockedIP.source,
            confidence: blockedIP.abuseConfidenceScore,
            blocklistId: blockedIP.id
          }
        });

        // Create Threat entry for Threat Summary
        // Use authenticated user ID if available, otherwise use system user or first admin
        try {
          // Map blocklist threat type to Threat model threat type
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

          let threatUserId = req.user ? req.user.id : null;
          
          // If no user is authenticated, find first admin to associate the threat with
          // This ensures threats are tracked even for unauthenticated blocks
          if (!threatUserId) {
            try {
              const User = require('../models/User');
              const admin = await User.findOne({ 
                where: { role: 'admin' },
                attributes: ['id'],
                limit: 1
              });
              if (admin) {
                threatUserId = admin.id;
              }
            } catch (adminError) {
              console.warn('Could not find admin for threat association:', adminError.message);
            }
          }

          // Only create Threat entry if we have a userId (either from req.user or admin)
          if (threatUserId) {
            await Threat.create({
              threatType: threatTypeMap[blockedIP.threatType] || 'other',
              sourceIp: clientIP,
              description: `Blocked threat IP: ${clientIP} (${blockedIP.threatType}) from ${blockedIP.source}`,
              severity: blockedIP.abuseConfidenceScore >= 90 ? 'critical' : 
                       blockedIP.abuseConfidenceScore >= 75 ? 'high' : 
                       blockedIP.abuseConfidenceScore >= 50 ? 'medium' : 'low',
              blocked: true,
              userId: threatUserId
            });
          }
        } catch (threatError) {
          console.error('Error creating Threat entry:', threatError);
          // Continue even if Threat creation fails
        }
      } catch (logError) {
        console.error('Error logging blocked threat:', logError);
      }

      // Return 403 Forbidden
      return res.status(403).json({
        success: false,
        message: 'Access denied: Your IP address has been flagged as a threat',
        error: 'IP_BLOCKED',
        blockedIP: clientIP,
        reason: blockedIP.threatType
      });
    }

    // IP is not blocked, continue
    next();
  } catch (error) {
    // If there's an error checking the blocklist, log it but don't block the request
    console.error('Error in threat blocker middleware:', error);
    // Continue with the request to avoid blocking legitimate users due to system errors
    next();
  }
};

module.exports = {
  threatBlockerMiddleware,
  refreshBlocklistCache,
  loadBlocklistCache
};

