const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const ImpersonationSession = sequelize.define('ImpersonationSession', {
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
  targetUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'impersonation_sessions',
  timestamps: true,
  underscored: true, // Use snake_case for column names
  indexes: [
    { fields: ['adminUserId'] }, // Sequelize will convert to admin_user_id
    { fields: ['targetUserId'] }, // Sequelize will convert to target_user_id
    { fields: ['isActive'] } // Sequelize will convert to is_active
  ]
});

ImpersonationSession.belongsTo(User, { foreignKey: 'adminUserId', as: 'adminUser' });
ImpersonationSession.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });

module.exports = ImpersonationSession;

