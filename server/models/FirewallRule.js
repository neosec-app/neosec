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
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 2
    },
    comment: '0: TCP, 1: UDP, 2: BOTH'
  },
  action: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 2
    },
    comment: '0: ACCEPT, 1: REJECT, 2: DROP'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'firewall_rules',
  timestamps: true,
  underscored: true // Use snake_case for column names
});

// Associations
FirewallRule.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(FirewallRule, { foreignKey: 'userId', as: 'firewallRules' });

module.exports = FirewallRule;

