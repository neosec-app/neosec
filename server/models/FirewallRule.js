const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const FirewallRule = sequelize.define('FirewallRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'ip_address', // Explicitly map to database column
    comment: 'CIDR Format supported'
  },
  port_start: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'port_start', // Explicitly map to database column
    validate: {
      min: 0,
      max: 65535
    }
  },
  port_end: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'port_end', // Explicitly map to database column
    validate: {
      min: 0,
      max: 65535
    }
  },
  protocol: {
    type: DataTypes.INTEGER, // Will be converted to ENUM string if database has ENUM
    allowNull: false,
    validate: {
      min: 0,
      max: 2
    },
    comment: '0: TCP, 1: UDP, 2: BOTH (stored as integer or enum string)'
  },
  action: {
    type: DataTypes.INTEGER, // Will be converted to ENUM string if database has ENUM
    allowNull: false,
    validate: {
      min: 0,
      max: 2
    },
    comment: '0: ACCEPT, 1: REJECT, 2: DROP (stored as integer or enum string)'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'userId', // Explicitly map to camelCase column (database has userId, not user_id)
    references: {
      model: 'users',
      key: 'id'
    }
  },
  direction: {
    type: DataTypes.STRING,
    allowNull: true, // Optional field - only used if column exists in database
    field: 'direction',
    defaultValue: 'inbound' // Default value if column exists
  }
}, {
  tableName: 'firewall_rules',
  timestamps: true,
  underscored: false, // Disable underscored since database uses camelCase for userId
  // Note: ip_address, port_start, port_end are explicitly mapped above with field option
  hooks: {
    // Convert integer protocol/action to ENUM strings if database uses ENUM
    beforeSave: async (firewallRule) => {
      // Check if we need to convert (this will be handled in controller for now)
      // The controller will handle the conversion before create/update
    },
    // Convert ENUM strings back to integers when reading
    afterFind: async (firewallRule) => {
      if (!firewallRule) return;
      
      const rules = Array.isArray(firewallRule) ? firewallRule : [firewallRule];
      rules.forEach(rule => {
        if (rule && rule.dataValues) {
          // Convert protocol ENUM string to integer
          if (typeof rule.dataValues.protocol === 'string') {
            const protocolMap = { 'tcp': 0, 'udp': 1, 'both': 2, 'TCP': 0, 'UDP': 1, 'BOTH': 2 };
            rule.dataValues.protocol = protocolMap[rule.dataValues.protocol] ?? 0;
          }
          // Convert action ENUM string to integer
          if (typeof rule.dataValues.action === 'string') {
            const actionMap = { 'accept': 0, 'reject': 1, 'drop': 2, 'ACCEPT': 0, 'REJECT': 1, 'DROP': 2 };
            rule.dataValues.action = actionMap[rule.dataValues.action] ?? 0;
          }
        }
      });
    }
  }
});

// Associations
FirewallRule.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(FirewallRule, { foreignKey: 'userId', as: 'firewallRules' });

module.exports = FirewallRule;

