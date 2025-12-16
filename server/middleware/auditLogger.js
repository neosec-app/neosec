const AuditLog = require('../models/AuditLog');

/**
 * Middleware to log admin actions to audit trail
 * Usage: Add after protect and admin middleware
 */
const auditLogger = (action, category = 'System') => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Log after response is sent
      if (req.user && req.user.role === 'admin') {
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        AuditLog.create({
          adminUserId: req.user.id,
          action: action,
          category: category,
          targetUserId: req.body?.userId || req.params?.id || null,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            result: data.success ? 'success' : 'failure'
          }),
          ipAddress: ipAddress,
          userAgent: userAgent,
          result: data.success ? 'success' : 'failure',
          metadata: {
            responseStatus: res.statusCode
          }
        }).catch(err => {
          console.error('Audit log error:', err);
          // Don't fail the request if audit logging fails
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Helper function to create audit log entry manually
 */
const createAuditLog = async (adminUserId, action, category, options = {}) => {
  try {
    await AuditLog.create({
      adminUserId,
      action,
      category,
      targetUserId: options.targetUserId || null,
      details: options.details || null,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      result: options.result || 'success',
      metadata: options.metadata || {}
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

module.exports = { auditLogger, createAuditLog };

