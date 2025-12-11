const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const FirewallRule = sequelize.define('FirewallRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  action: {
    type: DataTypes.ENUM('allow', 'deny'),
    allowNull: false
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    allowNull: false
  },
  protocol: {
    type: DataTypes.ENUM('any', 'tcp', 'udp', 'icmp'),
    allowNull: false,
    defaultValue: 'any'
  },
  sourceIP: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destinationIP: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sourcePort: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destinationPort: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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

