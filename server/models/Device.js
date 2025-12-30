const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  osType: {
    type: DataTypes.ENUM('Windows', 'macOS', 'Linux', 'iOS', 'Android'),
    allowNull: false
  },
  osVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  appVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastOnlineAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  vpnStatus: {
    type: DataTypes.ENUM('connected', 'disconnected', 'connecting', 'error'),
    defaultValue: 'disconnected',
    allowNull: false
  },
  firewallSyncStatus: {
    type: DataTypes.ENUM('synced', 'pending', 'failed', 'never'),
    defaultValue: 'never',
    allowNull: false
  },
  lastFirewallSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'devices',
  timestamps: true,
  underscored: false, // Disable underscored since database uses camelCase columns
  indexes: [
    { fields: ['userId'] },
    { fields: ['deviceId'] },
    { fields: ['isActive'] }
  ]
});

Device.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Device;

