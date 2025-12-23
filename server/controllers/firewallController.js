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
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: rules
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
    const { ip_address, port_start, port_end, protocol, action } = req.body;
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
      port_start: port_start !== undefined ? port_start : null,
      port_end: port_end !== undefined ? port_end : null,
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

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Create firewall rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating firewall rule'
    });
  }
};

// Update an existing firewall rule
const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { ip_address, port_start, port_end, protocol, action } = req.body;

    const rule = await FirewallRule.findOne({
      where: { id, userId: req.user.id }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Firewall rule not found'
      });
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
    rule.protocol = protocol ?? rule.protocol;
    rule.action = action ?? rule.action;

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

    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Update firewall rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating firewall rule'
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

