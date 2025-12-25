const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Device = require('./Device');


const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  eventType: {
    type: DataTypes.ENUM(
      'VPN Connection',
      'VPN Disconnection',
      'Blocked Threat',
      'System Event',
      'Notification',
      'Firewall Rule Update',
      'Profile Activation',
      'Profile Deactivation',
      'Blocklist Update',
      'User Action',
      'Other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Success', 'Failed', 'Blocked', 'Disconnected', 'Pending'),
    allowNull: false,
    defaultValue: 'Success'
  },
  severity: {
    type: DataTypes.ENUM('critical', 'warning', 'info'),
    allowNull: false,
    defaultValue: 'info'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  deviceId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'devices',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false, // Only track createdAt
  tableName: 'activity_logs',
  indexes: [
    { fields: ['eventType'] },
    { fields: ['severity'] },
    { fields: ['status'] },
    { fields: ['userId'] },
    { fields: ['deviceId'] },
    { fields: ['ipAddress'] },
    { fields: ['createdAt'] }
  ]
});

// Define associations
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ActivityLog.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });

module.exports = ActivityLog;


