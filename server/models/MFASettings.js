const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const MFASettings = sequelize.define('MFASettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('email_otp', 'authenticator_app', 'sms'),
    allowNull: true
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  backupCodes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'mfa_settings',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['enabled'] }
  ]
});

MFASettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = MFASettings;

