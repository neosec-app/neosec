const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('User Management', 'Firewall', 'Security', 'Settings', 'System'),
    allowNull: false
  },
  targetUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  result: {
    type: DataTypes.ENUM('success', 'failure'),
    defaultValue: 'success',
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  indexes: [
    { fields: ['adminUserId'] },
    { fields: ['targetUserId'] },
    { fields: ['category'] },
    { fields: ['createdAt'] },
    { fields: ['action'] }
  ]
});

AuditLog.belongsTo(User, { foreignKey: 'adminUserId', as: 'adminUser' });
AuditLog.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

module.exports = AuditLog;

