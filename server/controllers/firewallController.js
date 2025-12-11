const FirewallRule = require('../models/FirewallRule');

// Helper to validate payload
const validateRulePayload = (payload) => {
  const errors = [];
  if (!payload.action || !['allow', 'deny'].includes(payload.action)) {
    errors.push('action must be allow or deny');
  }
  if (!payload.direction || !['inbound', 'outbound'].includes(payload.direction)) {
    errors.push('direction must be inbound or outbound');
  }
  if (!payload.ipAddress && !payload.port) {
    errors.push('at least one criteria (ipAddress or port) is required');
  }
  return errors;
};

// Get all firewall rules for the current user
const getRules = async (req, res) => {
  try {
    const rules = await FirewallRule.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Get firewall rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching firewall rules'
    });
  }
};

// Create a new firewall rule
const createRule = async (req, res) => {
  try {
    const { action, direction, ipAddress, port, description } = req.body;
    const errors = validateRulePayload({ action, direction, ipAddress, port });
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const rule = await FirewallRule.create({
      action,
      direction,
      ipAddress: ipAddress || null,
      port: port || null,
      description: description || null,
      userId: req.user.userId
    });

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
    const { action, direction, ipAddress, port, description } = req.body;

    const rule = await FirewallRule.findOne({
      where: { id, userId: req.user.userId }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Firewall rule not found'
      });
    }

    const errors = validateRulePayload({
      action: action ?? rule.action,
      direction: direction ?? rule.direction,
      ipAddress: ipAddress ?? rule.ipAddress,
      port: port ?? rule.port
    });
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    rule.action = action ?? rule.action;
    rule.direction = direction ?? rule.direction;
    rule.ipAddress = ipAddress ?? rule.ipAddress;
    rule.port = port ?? rule.port;
    rule.description = description ?? rule.description;

    await rule.save();

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
      where: { id, userId: req.user.userId }
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Firewall rule not found'
      });
    }

    await rule.destroy();

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

