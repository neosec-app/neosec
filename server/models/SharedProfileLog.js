const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SharedProfileLog = sequelize.define('SharedProfileLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sharedProfileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'shared_profiles',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM(
      'CREATED',
      'VIEWED',
      'IMPORTED',
      'REVOKED',
      'EXPIRED',
      'ACCESS_DENIED',
      'PASSWORD_FAILED'
    ),
    allowNull: false
  },
  accessorEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email of the user who accessed the link (if logged in)'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data like geolocation, device info, etc.'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'shared_profile_logs',
  timestamps: true,
  updatedAt: false
});

module.exports = SharedProfileLog;