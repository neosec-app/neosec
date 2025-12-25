const FirewallRule = require('../models/FirewallRule');
const ActivityLog = require('../models/ActivityLog');
const { getClientIP } = require('../utils/ipUtils');

// Helper to validate payload
const validateRulePayload = (payload) => {
  const errors = [];
  if (payload.ip_address === undefined || payload.ip_address === null || payload.ip_address === '') {
    errors.push('ip_address is required');
  }
  // Protocol and action should already be converted to integers by this point
  const protocolNum = Number(payload.protocol);
  const actionNum = Number(payload.action);
  if (isNaN(protocolNum) || ![0, 1, 2].includes(protocolNum)) {
    errors.push('protocol must be 0 (TCP), 1 (UDP), or 2 (BOTH)');
  }
  if (isNaN(actionNum) || ![0, 1, 2].includes(actionNum)) {
    errors.push('action must be 0 (ACCEPT), 1 (REJECT), or 2 (DROP)');
  }
  if (payload.port_start !== undefined && payload.port_start !== null) {
    const portStartNum = Number(payload.port_start);
    if (isNaN(portStartNum) || !Number.isInteger(portStartNum) || portStartNum < 0 || portStartNum > 65535) {
      errors.push('port_start must be an integer between 0 and 65535');
    }
  }
  if (payload.port_end !== undefined && payload.port_end !== null) {
    const portEndNum = Number(payload.port_end);
    if (isNaN(portEndNum) || !Number.isInteger(portEndNum) || portEndNum < 0 || portEndNum > 65535) {
      errors.push('port_end must be an integer between 0 and 65535');
    }
  }
  if (payload.port_start !== undefined && payload.port_end !== undefined &&
      payload.port_start !== null && payload.port_end !== null) {
    const portStartNum = Number(payload.port_start);
    const portEndNum = Number(payload.port_end);
    if (!isNaN(portStartNum) && !isNaN(portEndNum) && portStartNum > portEndNum) {
      errors.push('port_start cannot be greater than port_end');
    }
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
    // Also convert ENUM strings to integers if needed
    const rulesData = rules.map(rule => {
      let protocol = rule.protocol;
      let action = rule.action;
      
      // Convert protocol ENUM string to integer
      if (typeof protocol === 'string') {
        const protocolMap = { 'tcp': 0, 'udp': 1, 'both': 2, 'TCP': 0, 'UDP': 1, 'BOTH': 2 };
        protocol = protocolMap[protocol] ?? 0;
      }
      
      // Convert action ENUM string to integer
      if (typeof action === 'string') {
        const actionMap = { 'accept': 0, 'reject': 1, 'drop': 2, 'ACCEPT': 0, 'REJECT': 1, 'DROP': 2 };
        action = actionMap[action] ?? 0;
      }
      
      return {
        id: rule.id,
        ip_address: rule.ip_address,
        port_start: rule.port_start,
        port_end: rule.port_end,
        protocol,
        action,
        userId: rule.userId,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
    });

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
    console.log('Received firewall rule data:', { 
      ip_address, 
      port_start, 
      port_end, 
      protocol, 
      action, 
      protocolType: typeof protocol, 
      actionType: typeof action,
      rawBody: req.body
    });
    
    // Convert values to proper types BEFORE validation
    // Handle string numbers, actual numbers, and null/undefined
    protocol = protocol !== undefined && protocol !== null 
      ? (typeof protocol === 'string' ? parseInt(protocol, 10) : Number(protocol))
      : undefined;
    action = action !== undefined && action !== null 
      ? (typeof action === 'string' ? parseInt(action, 10) : Number(action))
      : undefined;
    port_start = port_start !== undefined && port_start !== null && port_start !== '' 
      ? (typeof port_start === 'string' ? parseInt(port_start, 10) : Number(port_start))
      : null;
    port_end = port_end !== undefined && port_end !== null && port_end !== '' 
      ? (typeof port_end === 'string' ? parseInt(port_end, 10) : Number(port_end))
      : null;
    
    console.log('After conversion:', { protocol, action, port_start, port_end });
    
    // Validate after conversion
    if (protocol === undefined || protocol === null || isNaN(protocol) || protocol < 0 || protocol > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid protocol value. Must be 0 (TCP), 1 (UDP), or 2 (BOTH)',
        received: req.body.protocol,
        converted: protocol
      });
    }
    if (action === undefined || action === null || isNaN(action) || action < 0 || action > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action value. Must be 0 (ACCEPT), 1 (REJECT), or 2 (DROP)',
        received: req.body.action,
        converted: action
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

    // Try to create with integers first (most common case)
    // If that fails with ENUM error, retry with ENUM strings
    let rule;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        let protocolValue = protocol;
        let actionValue = action;
        
        // On first attempt, use integers
        // On subsequent attempts, try different ENUM string cases
        if (attempts === 1) {
          // Try uppercase ENUM strings
          const protocolMap = { 0: 'TCP', 1: 'UDP', 2: 'BOTH' };
          const actionMap = { 0: 'ACCEPT', 1: 'REJECT', 2: 'DROP' };
          protocolValue = protocolMap[protocol] || 'TCP';
          actionValue = actionMap[action] || 'ACCEPT';
          console.log(`Attempt ${attempts + 1}: Trying uppercase ENUM values - protocol: ${protocolValue}, action: ${actionValue}`);
        } else if (attempts === 2) {
          // Try lowercase ENUM strings
          const protocolMap = { 0: 'tcp', 1: 'udp', 2: 'both' };
          const actionMap = { 0: 'accept', 1: 'reject', 2: 'drop' };
          protocolValue = protocolMap[protocol] || 'tcp';
          actionValue = actionMap[action] || 'accept';
          console.log(`Attempt ${attempts + 1}: Trying lowercase ENUM values - protocol: ${protocolValue}, action: ${actionValue}`);
        } else {
          console.log(`Attempt ${attempts + 1}: Trying integer values - protocol: ${protocolValue}, action: ${actionValue}`);
        }
        
        rule = await FirewallRule.create({
          ip_address,
          port_start,
          port_end,
          protocol: protocolValue,
          action: actionValue,
          userId: req.user.id
        });
        
        console.log('Successfully created firewall rule on attempt', attempts + 1);
        break; // Success, exit loop
        
      } catch (createError) {
        attempts++;
        console.error(`FirewallRule.create attempt ${attempts} failed:`, createError.message);
        
        // Check if it's an ENUM error
        const isEnumError = createError.original && createError.original.message && 
          (createError.original.message.includes('invalid input value for enum') ||
           createError.original.message.includes('enum'));
        
        if (isEnumError && attempts < maxAttempts) {
          console.log(`ENUM error detected on attempt ${attempts}, will retry with different case...`);
          continue; // Try next attempt
        } else if (attempts >= maxAttempts) {
          // All attempts failed
          console.error('All attempts to create firewall rule failed');
          console.error('Final error:', createError);
          console.error('Error original:', createError.original);
          console.error('Error stack:', createError.stack);
          throw createError;
        } else {
          // Not an ENUM error, throw immediately
          throw createError;
        }
      }
    }

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

    // Convert ENUM strings back to integers for response
    let responseProtocol = rule.protocol;
    let responseAction = rule.action;
    if (typeof responseProtocol === 'string') {
      const protocolMap = { 'tcp': 0, 'udp': 1, 'both': 2, 'TCP': 0, 'UDP': 1, 'BOTH': 2 };
      responseProtocol = protocolMap[responseProtocol] ?? 0;
    }
    if (typeof responseAction === 'string') {
      const actionMap = { 'accept': 0, 'reject': 1, 'drop': 2, 'ACCEPT': 0, 'REJECT': 1, 'DROP': 2 };
      responseAction = actionMap[responseAction] ?? 0;
    }
    
    // Return consistent format
    res.status(201).json({
      success: true,
      data: {
        id: rule.id,
        ip_address: rule.ip_address,
        port_start: rule.port_start,
        port_end: rule.port_end,
        protocol: responseProtocol,
        action: responseAction,
        userId: rule.userId,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }
    });
  } catch (error) {
    console.error('Create firewall rule error:', error);
    console.error('Error details:', error.message);
    console.error('Error original:', error.original);
    console.error('Error stack:', error.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Server error creating firewall rule';
    if (error.original && error.original.code === '22P02') {
      errorMessage = 'Invalid protocol or action value. The database ENUM type may not match the expected values.';
    } else if (error.original && error.original.message) {
      if (error.original.message.includes('enum')) {
        errorMessage = `Database ENUM error: ${error.original.message}. The conversion script may need to run to convert ENUMs to INTEGERs.`;
      } else {
        errorMessage = `Database error: ${error.original.message}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        original: error.original?.message,
        code: error.original?.code,
        sql: error.sql
      } : undefined
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

    // Check if database has ENUM columns and convert values accordingly
    let protocolValue = protocol !== undefined ? protocol : rule.protocol;
    let actionValue = action !== undefined ? action : rule.action;
    
    try {
      const { sequelize } = require('../config/db');
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'firewall_rules' 
        AND column_name IN ('protocol', 'action')
        AND table_schema = 'public';
      `);
      
      const protocolColumn = columns.find(col => col.column_name === 'protocol');
      const actionColumn = columns.find(col => col.column_name === 'action');
      
      // If ENUM type, get the actual ENUM values and convert integer to correct string
      if (protocol !== undefined && protocolColumn && protocolColumn.data_type === 'USER-DEFINED') {
        try {
          const [enumValues] = await sequelize.query(`
            SELECT unnest(enum_range(NULL::${protocolColumn.udt_name}))::text AS enum_value;
          `);
          const enumVals = enumValues.map(e => e.enum_value);
          const protocolMap = {};
          if (enumVals.includes('TCP') || enumVals.includes('tcp')) {
            protocolMap[0] = enumVals.find(v => v.toLowerCase() === 'tcp') || 'tcp';
            protocolMap[1] = enumVals.find(v => v.toLowerCase() === 'udp') || 'udp';
            protocolMap[2] = enumVals.find(v => v.toLowerCase() === 'both') || 'both';
          } else {
            protocolMap[0] = 'tcp';
            protocolMap[1] = 'udp';
            protocolMap[2] = 'both';
          }
          protocolValue = protocolMap[protocol] || protocolMap[0];
          console.log(`Converting protocol ${protocol} to ENUM: ${protocolValue}`);
        } catch (enumError) {
          const protocolMap = { 0: 'TCP', 1: 'UDP', 2: 'BOTH' };
          protocolValue = protocolMap[protocol] || 'TCP';
        }
      }
      
      if (action !== undefined && actionColumn && actionColumn.data_type === 'USER-DEFINED') {
        try {
          const [enumValues] = await sequelize.query(`
            SELECT unnest(enum_range(NULL::${actionColumn.udt_name}))::text AS enum_value;
          `);
          const enumVals = enumValues.map(e => e.enum_value);
          const actionMap = {};
          if (enumVals.includes('ACCEPT') || enumVals.includes('accept')) {
            actionMap[0] = enumVals.find(v => v.toLowerCase() === 'accept') || 'accept';
            actionMap[1] = enumVals.find(v => v.toLowerCase() === 'reject') || 'reject';
            actionMap[2] = enumVals.find(v => v.toLowerCase() === 'drop') || 'drop';
          } else {
            actionMap[0] = 'accept';
            actionMap[1] = 'reject';
            actionMap[2] = 'drop';
          }
          actionValue = actionMap[action] || actionMap[0];
          console.log(`Converting action ${action} to ENUM: ${actionValue}`);
        } catch (enumError) {
          const actionMap = { 0: 'ACCEPT', 1: 'REJECT', 2: 'DROP' };
          actionValue = actionMap[action] || 'ACCEPT';
        }
      }
    } catch (typeCheckError) {
      console.warn('Could not check column types during update:', typeCheckError.message);
    }

    rule.ip_address = ip_address ?? rule.ip_address;
    rule.port_start = port_start !== undefined ? port_start : rule.port_start;
    rule.port_end = port_end !== undefined ? port_end : rule.port_end;
    rule.protocol = protocolValue;
    rule.action = actionValue;

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

    // Convert ENUM strings back to integers for response
    let responseProtocol = rule.protocol;
    let responseAction = rule.action;
    if (typeof responseProtocol === 'string') {
      const protocolMap = { 'tcp': 0, 'udp': 1, 'both': 2, 'TCP': 0, 'UDP': 1, 'BOTH': 2 };
      responseProtocol = protocolMap[responseProtocol] ?? 0;
    }
    if (typeof responseAction === 'string') {
      const actionMap = { 'accept': 0, 'reject': 1, 'drop': 2, 'ACCEPT': 0, 'REJECT': 1, 'DROP': 2 };
      responseAction = actionMap[responseAction] ?? 0;
    }
    
    // Return consistent format
    res.status(200).json({
      success: true,
      data: {
        id: rule.id,
        ip_address: rule.ip_address,
        port_start: rule.port_start,
        port_end: rule.port_end,
        protocol: responseProtocol,
        action: responseAction,
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

