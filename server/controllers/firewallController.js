const FirewallRule = require('../models/FirewallRule');
const ActivityLog = require('../models/ActivityLog');
const { getClientIP } = require('../utils/ipUtils');
const { sequelize } = require('../config/db');

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

// Helper: Normalize and validate rule input
const normalizeAndValidateRuleInput = (body, userId = null) => {
  let { ip_address, port_start, port_end, protocol, action, direction } = body;
  
  // Log received values for debugging
  console.log('Received firewall rule data:', {
    ip_address,
    port_start,
    port_end,
    protocol,
    action,
    direction,
    protocolType: typeof protocol,
    actionType: typeof action,
    directionType: typeof direction,
    userId: userId
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
    return {
      error: {
        status: 400,
        message: 'Invalid protocol value. Must be 0 (TCP), 1 (UDP), or 2 (BOTH)',
        received: body.protocol,
        converted: protocol
      }
    };
  }
  if (action === undefined || action === null || isNaN(action) || action < 0 || action > 2) {
    return {
      error: {
        status: 400,
        message: 'Invalid action value. Must be 0 (ACCEPT), 1 (REJECT), or 2 (DROP)',
        received: body.action,
        converted: action
      }
    };
  }
  
  const errors = validateRulePayload({ ip_address, port_start, port_end, protocol, action });
  if (errors.length) {
    return {
      error: {
        status: 400,
        message: 'Validation failed',
        errors
      }
    };
  }
  
  return {
    ip_address,
    port_start,
    port_end,
    protocol,
    action,
    direction
  };
};

// Helper: Create firewall rule in database with retry logic
const createFirewallRuleInDB = async (ruleData, userId) => {
  const { ip_address, port_start, port_end, protocol, action, direction } = ruleData;
  
  // Always use integers - database should have INTEGER columns
  // If database has ENUMs, the fixFirewallRulesColumns script should convert them
  console.log('Creating firewall rule with integer values:', { 
    ip_address, 
    port_start, 
    port_end, 
    protocol, 
    action, 
    userId 
  });
  
  let rule;
  try {
    // Always include direction with value from request or default to 'inbound'
    // If column doesn't exist, error handling will retry without it
    const createData = {
      ip_address: ip_address.trim(),
      port_start,
      port_end,
      protocol: protocol, // Always integer
      action: action, // Always integer
      userId: userId,
      direction: direction || 'inbound' // Use direction from request or default
    };

    console.log('Creating firewall rule with data:', createData);
    rule = await FirewallRule.create(createData);
    console.log('Successfully created firewall rule:', rule.id, 'with direction:', rule.direction);
  } catch (createError) {
    console.error('FirewallRule.create failed:', createError.message);
    console.error('Error details:', {
      message: createError.message,
      original: createError.original?.message,
      code: createError.original?.code,
      sql: createError.sql,
      stack: createError.stack
    });
    
    // Check if it's a missing column error (like direction)
    const isMissingColumnError = createError.original && createError.original.message && 
      (createError.original.message.includes('column') &&
       createError.original.message.includes('does not exist'));
    
    // If direction column doesn't exist, retry without it
    if (isMissingColumnError && createError.original.message.includes('direction')) {
      console.log('Retrying without direction column...');
      const createDataWithoutDirection = {
        ip_address: ip_address.trim(),
        port_start,
        port_end,
        protocol: protocol,
        action: action,
        userId: userId
        // Note: direction column doesn't exist, so we don't include it
      };
      rule = await FirewallRule.create(createDataWithoutDirection);
      console.log('Successfully created firewall rule (without direction):', rule.id);
    } else {
      // Check if it's an ENUM error - database needs migration
      const isEnumError = createError.original && createError.original.message && 
        (createError.original.message.includes('invalid input value for enum') ||
         createError.original.message.includes('enum') ||
         createError.original.code === '22P02');
      
      if (isEnumError) {
        throw {
          isEnumError: true,
          originalError: createError
        };
      }
      
      // Check if it's a NOT NULL constraint error for direction
      const isNotNullError = createError.original && createError.original.message && 
        createError.original.message.includes('null value in column "direction"');
      
      if (isNotNullError) {
        // Retry with direction value
        console.log('Retrying with direction value...');
        const createDataWithDirection = {
          ip_address: ip_address.trim(),
          port_start,
          port_end,
          protocol: protocol,
          action: action,
          userId: userId,
          direction: direction || 'inbound'
        };
        rule = await FirewallRule.create(createDataWithDirection);
        console.log('Successfully created firewall rule (with direction):', rule.id);
      } else {
        // Re-throw other errors to be handled by outer catch
        throw createError;
      }
    }
  }
  
  return rule;
};

// Helper: Log firewall rule creation
const logFirewallRuleCreation = async (rule, action, protocol, ip_address, userId, req) => {
  try {
    const ipAddress = getClientIP(req);
    const actionText = action === 0 ? 'ACCEPT' : action === 1 ? 'REJECT' : 'DROP';
    const protocolText = protocol === 0 ? 'TCP' : protocol === 1 ? 'UDP' : 'BOTH';
    await ActivityLog.create({
      eventType: 'Firewall Rule Update',
      description: `Firewall rule created: ${actionText} ${protocolText} for ${ip_address}`,
      status: 'Success',
      severity: 'info',
      userId: userId,
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
};

// Helper: Format firewall rule response
const formatFirewallRuleResponse = (rule) => {
  // Ensure protocol and action are integers in response (they should already be)
  let responseProtocol = typeof rule.protocol === 'string' 
    ? (rule.protocol.toLowerCase() === 'tcp' ? 0 : rule.protocol.toLowerCase() === 'udp' ? 1 : 2)
    : Number(rule.protocol);
  let responseAction = typeof rule.action === 'string'
    ? (rule.action.toLowerCase() === 'accept' ? 0 : rule.action.toLowerCase() === 'reject' ? 1 : 2)
    : Number(rule.action);
  
  return {
    id: rule.id,
    ip_address: rule.ip_address,
    port_start: rule.port_start,
    port_end: rule.port_end,
    protocol: responseProtocol,
    action: responseAction,
    direction: rule.direction || 'inbound', // Include direction field
    userId: rule.userId,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt
  };
};

// Helper: Format error response
const formatFirewallErrorResponse = (error) => {
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
  
  // Always include error details in development, and include helpful info in production
  const errorResponse = {
    success: false,
    message: errorMessage
  };
  
  // Include detailed error info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      message: error.message,
      original: error.original?.message,
      code: error.original?.code,
      sql: error.sql,
      stack: error.stack
    };
  } else {
    // In production, still include the original error message if it's helpful
    if (error.original?.message) {
      errorResponse.error = {
        message: error.original.message,
        code: error.original.code
      };
    }
  }
  
  return errorResponse;
};

// Get all firewall rules for the current user
const getRules = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('Fetching firewall rules for user:', req.user.id);
    
    const rules = await FirewallRule.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']], // Newest rules first
      raw: false // Get model instances to ensure proper field mapping
    });

    console.log(`Found ${rules.length} firewall rules`);

    // Convert to plain objects with correct field names
    // Also convert ENUM strings to integers if needed
    const rulesData = rules.map(rule => {
      let protocol = rule.protocol;
      let action = rule.action;
      
      // Convert protocol ENUM string to integer (if database still has ENUMs)
      if (typeof protocol === 'string') {
        const protocolMap = { 'tcp': 0, 'udp': 1, 'both': 2, 'TCP': 0, 'UDP': 1, 'BOTH': 2 };
        protocol = protocolMap[protocol] ?? 0;
      } else {
        protocol = Number(protocol);
      }
      
      // Convert action ENUM string to integer (if database still has ENUMs)
      if (typeof action === 'string') {
        const actionMap = { 'accept': 0, 'reject': 1, 'drop': 2, 'ACCEPT': 0, 'REJECT': 1, 'DROP': 2 };
        action = actionMap[action] ?? 0;
      } else {
        action = Number(action);
      }
      
      return {
        id: rule.id,
        ip_address: rule.ip_address,
        port_start: rule.port_start,
        port_end: rule.port_end,
        protocol,
        action,
        direction: rule.direction || 'inbound', // Include direction field
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
    console.error('Error original:', error.original);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching firewall rules',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        original: error.original?.message,
        code: error.original?.code,
        sql: error.sql
      } : undefined
    });
  }
};

// Create a new firewall rule
const createRule = async (req, res) => {
  try {
    // Check if userId exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Normalize and validate input
    const validationResult = normalizeAndValidateRuleInput(req.body, req.user.id);
    if (validationResult.error) {
      return res.status(validationResult.error.status).json({
        success: false,
        message: validationResult.error.message,
        ...(validationResult.error.received !== undefined && { received: validationResult.error.received }),
        ...(validationResult.error.converted !== undefined && { converted: validationResult.error.converted }),
        ...(validationResult.error.errors && { errors: validationResult.error.errors })
      });
    }

    const { ip_address, port_start, port_end, protocol, action, direction } = validationResult;

    // Create firewall rule in database (with retry logic)
    let rule;
    try {
      rule = await createFirewallRuleInDB({ ip_address, port_start, port_end, protocol, action, direction }, req.user.id);
    } catch (dbError) {
      // Handle ENUM error specifically
      if (dbError.isEnumError) {
        return res.status(500).json({
          success: false,
          message: 'Database schema error: protocol and action columns are ENUM types but should be INTEGER. Please run the migration script: node server/scripts/fixFirewallRulesColumns.js',
          error: process.env.NODE_ENV === 'development' ? {
            message: dbError.originalError.message,
            original: dbError.originalError.original?.message,
            code: dbError.originalError.original?.code
          } : undefined
        });
      }
      // Re-throw other database errors
      throw dbError;
    }

    // Log firewall rule creation
    await logFirewallRuleCreation(rule, action, protocol, ip_address, req.user.id, req);

    // Format and return response
    const responseData = formatFirewallRuleResponse(rule);
    res.status(201).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Create firewall rule error:', error);
    console.error('Error details:', error.message);
    console.error('Error original:', error.original);
    console.error('Error stack:', error.stack);
    
    const errorResponse = formatFirewallErrorResponse(error);
    res.status(500).json(errorResponse);
  }
};

// Update an existing firewall rule
const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    let { ip_address, port_start, port_end, protocol, action, direction } = req.body;

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
    rule.direction = direction ?? rule.direction ?? 'inbound'; // Update direction field

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
        direction: rule.direction || 'inbound', // Include direction field
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

