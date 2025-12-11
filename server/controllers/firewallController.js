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
  if (!payload.protocol || !['any', 'tcp', 'udp', 'icmp'].includes(payload.protocol)) {
    errors.push('protocol must be any, tcp, udp, or icmp');
  }
  return errors;
};

// Get all firewall rules for the current user
const getRules = async (req, res) => {
  try {
    // Try to order by 'order' column, fallback to createdAt if column doesn't exist
    let rules;
    try {
      rules = await FirewallRule.findAll({
        where: { userId: req.user.userId },
        order: [['order', 'ASC'], ['createdAt', 'ASC']]
      });
    } catch (orderError) {
      // If order column doesn't exist, just order by createdAt
      console.log('Order column not found, using createdAt for ordering');
      rules = await FirewallRule.findAll({
        where: { userId: req.user.userId },
        order: [['createdAt', 'ASC']]
      });
    }

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
    const { action, direction, protocol, sourceIP, destinationIP, sourcePort, destinationPort, description, enabled, order } = req.body;
    const errors = validateRulePayload({ action, direction, protocol: protocol || 'any' });
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Get max order for this user to set default
    const maxOrder = await FirewallRule.max('order', {
      where: { userId: req.user.userId }
    }) || 0;

    const rule = await FirewallRule.create({
      action,
      direction,
      protocol: protocol || 'any',
      sourceIP: sourceIP || null,
      destinationIP: destinationIP || null,
      sourcePort: sourcePort || null,
      destinationPort: destinationPort || null,
      description: description || null,
      enabled: enabled !== undefined ? enabled : true,
      order: order !== undefined ? order : maxOrder + 1,
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
    const { action, direction, protocol, sourceIP, destinationIP, sourcePort, destinationPort, description, enabled, order } = req.body;

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
      protocol: protocol ?? rule.protocol
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
    rule.protocol = protocol ?? rule.protocol;
    rule.sourceIP = sourceIP !== undefined ? sourceIP : rule.sourceIP;
    rule.destinationIP = destinationIP !== undefined ? destinationIP : rule.destinationIP;
    rule.sourcePort = sourcePort !== undefined ? sourcePort : rule.sourcePort;
    rule.destinationPort = destinationPort !== undefined ? destinationPort : rule.destinationPort;
    rule.description = description !== undefined ? description : rule.description;
    rule.enabled = enabled !== undefined ? enabled : rule.enabled;
    rule.order = order !== undefined ? order : rule.order;

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

