const FirewallRule = require('../models/FirewallRule');
const ActivityLog = require('../models/ActivityLog');
const { getClientIP } = require('../utils/ipUtils');

// Helper to validate payload
const validateRulePayload = (payload) => {
  const errors = [];
  if (payload.ip_address === undefined || payload.ip_address === null || payload.ip_address === '') {
    errors.push('ip_address is required');
  }
  if (payload.protocol === undefined || payload.protocol === null || ![0, 1, 2].includes(payload.protocol)) {
    errors.push('protocol must be 0 (TCP), 1 (UDP), or 2 (BOTH)');
  }
  if (payload.action === undefined || payload.action === null || ![0, 1, 2].includes(payload.action)) {
    errors.push('action must be 0 (ACCEPT), 1 (REJECT), or 2 (DROP)');
  }
  if (payload.port_start !== undefined && payload.port_start !== null) {
    if (!Number.isInteger(payload.port_start) || payload.port_start < 0 || payload.port_start > 65535) {
      errors.push('port_start must be an integer between 0 and 65535');
    }
  }
  if (payload.port_end !== undefined && payload.port_end !== null) {
    if (!Number.isInteger(payload.port_end) || payload.port_end < 0 || payload.port_end > 65535) {
      errors.push('port_end must be an integer between 0 and 65535');
    }
  }
  if (payload.port_start !== undefined && payload.port_end !== undefined &&
      payload.port_start !== null && payload.port_end !== null &&
      payload.port_start > payload.port_end) {
    errors.push('port_start cannot be greater than port_end');
  }
  return errors;
};

// Get all firewall rules for the current user
const getRules = async (req, res) => {
  try {
    const rules = await FirewallRule.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']],
      raw: false // Get model instances to ensure proper field mapping
    });

    // Convert to plain objects with correct field names
    const rulesData = rules.map(rule => ({
      id: rule.id,
      ip_address: rule.ip_address,
      port_start: rule.port_start,
      port_end: rule.port_end,
      protocol: rule.protocol,
      action: rule.action,
      userId: rule.userId,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: rulesData
    });
  } catch (error) {
    console.error('Get firewall rules error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching firewall rules',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new firewall rule
const createRule = async (req, res) => {
  try {
    let { ip_address, port_start, port_end, protocol, action } = req.body;
    
    // Log received values for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Received firewall rule data:', { ip_address, port_start, port_end, protocol, action, protocolType: typeof protocol, actionType: typeof action });
    }
    
    // Ensure protocol and action are integers (convert from string if needed)
    protocol = typeof protocol === 'string' ? parseInt(protocol, 10) : protocol;
    action = typeof action === 'string' ? parseInt(action, 10) : action;
    port_start = port_start !== undefined && port_start !== null ? (typeof port_start === 'string' ? parseInt(port_start, 10) : port_start) : null;
    port_end = port_end !== undefined && port_end !== null ? (typeof port_end === 'string' ? parseInt(port_end, 10) : port_end) : null;
    
    // Validate after conversion
    if (isNaN(protocol) || protocol < 0 || protocol > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid protocol value. Must be 0 (TCP), 1 (UDP), or 2 (BOTH)',
        received: req.body.protocol
      });
    }
    if (isNaN(action) || action < 0 || action > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action value. Must be 0 (ACCEPT), 1 (REJECT), or 2 (DROP)',
        received: req.body.action
      });
    }
    
    const errors = validateRulePayload({ ip_address, port_start, port_end, protocol, action });
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const rule = await FirewallRule.create({
      ip_address,
      port_start,
      port_end,
      protocol,
      action,
      userId: req.user.id
    });

    // Log firewall rule creation
    try {
      const ipAddress = getClientIP(req);
      const actionText = action === 0 ? 'ACCEPT' : action === 1 ? 'REJECT' : 'DROP';
      const protocolText = protocol === 0 ? 'TCP' : protocol === 1 ? 'UDP' : 'BOTH';
      await ActivityLog.create({
        eventType: 'Firewall Rule Update',
        description: `Firewall rule created: ${actionText} ${protocolText} for ${ip_address}`,
        status: 'Success',
        severity: 'info',
        userId: req.user.id,
        ipAddress: ipAddress,
        metadata: {
          ruleId: rule.id,
          action,
          protocol,
          ip_address
        }
      });
    } catch (logError) {
      console.error('Error logging firewall rule creation:', logError);
    }

    // Return consistent format
    res.status(201).json({
      success: true,
      data: {
        id: rule.id,
        ip_address: rule.ip_address,
        port_start: rule.port_start,
        port_end: rule.port_end,
        protocol: rule.protocol,
        action: rule.action,
        userId: rule.userId,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }
    });
  } catch (error) {
    console.error('Create firewall rule error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Server error creating firewall rule';
    if (error.original && error.original.code === '22P02') {
      errorMessage = 'Invalid protocol or action value. Please ensure protocol and action are integers (0-2).';
    } else if (error.original && error.original.message) {
      errorMessage = `Database error: ${error.original.message}`;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update an existing firewall rule
const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    let { ip_address, port_start, port_end, protocol, action } = req.body;

    const rule = await FirewallRule.findOne({
      where: { id, userId: req.user.id }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Firewall rule not found'
      });
    }

    // Ensure protocol and action are integers (convert from string if needed)
    if (protocol !== undefined && protocol !== null) {
      protocol = typeof protocol === 'string' ? parseInt(protocol, 10) : protocol;
    }
    if (action !== undefined && action !== null) {
      action = typeof action === 'string' ? parseInt(action, 10) : action;
    }
    if (port_start !== undefined && port_start !== null) {
      port_start = typeof port_start === 'string' ? parseInt(port_start, 10) : port_start;
    }
    if (port_end !== undefined && port_end !== null) {
      port_end = typeof port_end === 'string' ? parseInt(port_end, 10) : port_end;
    }

    const errors = validateRulePayload({
      ip_address: ip_address ?? rule.ip_address,
      port_start: port_start ?? rule.port_start,
      port_end: port_end ?? rule.port_end,
      protocol: protocol ?? rule.protocol,
      action: action ?? rule.action
    });
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    rule.ip_address = ip_address ?? rule.ip_address;
    rule.port_start = port_start !== undefined ? port_start : rule.port_start;
    rule.port_end = port_end !== undefined ? port_end : rule.port_end;
    rule.protocol = protocol !== undefined ? protocol : rule.protocol;
    rule.action = action !== undefined ? action : rule.action;

    await rule.save();

    // Log firewall rule update
    try {
      const ipAddress = getClientIP(req);
      const actionText = rule.action === 0 ? 'ACCEPT' : rule.action === 1 ? 'REJECT' : 'DROP';
      const protocolText = rule.protocol === 0 ? 'TCP' : rule.protocol === 1 ? 'UDP' : 'BOTH';
      await ActivityLog.create({
        eventType: 'Firewall Rule Update',
        description: `Firewall rule updated: ${actionText} ${protocolText} for ${rule.ip_address}`,
        status: 'Success',
        severity: 'info',
        userId: req.user.id,
        ipAddress: ipAddress,
        metadata: {
          ruleId: rule.id,
          action: rule.action,
          protocol: rule.protocol,
          ip_address: rule.ip_address
        }
      });
    } catch (logError) {
      console.error('Error logging firewall rule update:', logError);
    }

    // Return consistent format
    res.status(200).json({
      success: true,
      data: {
        id: rule.id,
        ip_address: rule.ip_address,
        port_start: rule.port_start,
        port_end: rule.port_end,
        protocol: rule.protocol,
        action: rule.action,
        userId: rule.userId,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }
    });
  } catch (error) {
    console.error('Update firewall rule error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Server error updating firewall rule';
    if (error.original && error.original.code === '22P02') {
      errorMessage = 'Invalid protocol or action value. Please ensure protocol and action are integers (0-2).';
    } else if (error.original && error.original.message) {
      errorMessage = `Database error: ${error.original.message}`;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a firewall rule
const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await FirewallRule.findOne({
      where: { id, userId: req.user.id }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Firewall rule not found'
      });
    }

    const actionText = rule.action === 0 ? 'ACCEPT' : rule.action === 1 ? 'REJECT' : 'DROP';
    const protocolText = rule.protocol === 0 ? 'TCP' : rule.protocol === 1 ? 'UDP' : 'BOTH';

    await rule.destroy();

    // Log firewall rule deletion
    try {
      const ipAddress = getClientIP(req);
      await ActivityLog.create({
        eventType: 'Firewall Rule Update',
        description: `Firewall rule deleted: ${actionText} ${protocolText} for ${rule.ip_address}`,
        status: 'Success',
        severity: 'info',
        userId: req.user.id,
        ipAddress: ipAddress,
        metadata: {
          ruleId: id,
          action: rule.action,
          protocol: rule.protocol,
          ip_address: rule.ip_address
        }
      });
    } catch (logError) {
      console.error('Error logging firewall rule deletion:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Firewall rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete firewall rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting firewall rule'
    });
  }
};

module.exports = {
  getRules,
  createRule,
  updateRule,
  deleteRule
};

