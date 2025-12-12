const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const LoginHistory = sequelize.define('LoginHistory', {
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
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  suspiciousActivity: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'login_history',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['ipAddress'] },
    { fields: ['success'] },
    { fields: ['suspiciousActivity'] },
    { fields: ['createdAt'] }
  ]
});

LoginHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = LoginHistory;

