// Middleware to check incoming requests against threat blocklist
const BlocklistIP = require('../models/BlocklistIP');
const ActivityLog = require('../models/ActivityLog');
const Threat = require('../models/Threat');
const { getClientIP, isLocalOrPrivateIP } = require('../utils/ipUtils');

/**
 * Middleware to block requests from IPs in the threat blocklist
 * This should be added early in the middleware chain
 */
const threatBlockerMiddleware = async (req, res, next) => {
  try {
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

    // Check if IP is in blocklist
    const blockedIP = await BlocklistIP.findOne({
      where: { ipAddress: clientIP }
    });

    if (blockedIP) {
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

        // Also create Threat entry for Threat Summary (if user is authenticated)
        if (req.user && req.user.id) {
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

            await Threat.create({
              threatType: threatTypeMap[blockedIP.threatType] || 'other',
              sourceIp: clientIP,
              description: `Blocked threat IP: ${clientIP} (${blockedIP.threatType}) from ${blockedIP.source}`,
              severity: blockedIP.abuseConfidenceScore >= 90 ? 'critical' : 
                       blockedIP.abuseConfidenceScore >= 75 ? 'high' : 
                       blockedIP.abuseConfidenceScore >= 50 ? 'medium' : 'low',
              blocked: true,
              userId: req.user.id
            });
          } catch (threatError) {
            console.error('Error creating Threat entry:', threatError);
            // Continue even if Threat creation fails
          }
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

module.exports = threatBlockerMiddleware;

