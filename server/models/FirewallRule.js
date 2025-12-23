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
    comment: 'CIDR Format supported'
  },
  port_start: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 65535
    }
  },
  port_end: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  timestamps: true
});

// Associations
FirewallRule.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(FirewallRule, { foreignKey: 'userId', as: 'firewallRules' });

module.exports = FirewallRule;

