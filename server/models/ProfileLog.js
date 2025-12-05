const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ProfileLog = sequelize.define('ProfileLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'profiles',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM(
      'CREATED',
      'UPDATED',
      'DELETED',
      'ACTIVATED',
      'DEACTIVATED',
      'SCHEDULED',
      'AUTO_ACTIVATED'
    ),
    allowNull: false
  },
  changes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'profile_logs',
  timestamps: true,
  updatedAt: false
});

module.exports = ProfileLog;