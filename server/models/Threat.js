const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Threat = sequelize.define('Threat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  threatType: {
    type: DataTypes.ENUM('malware', 'phishing', 'intrusion', 'ddos', 'suspicious', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  sourceIp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium'
  },
  blocked: {
    type: DataTypes.BOOLEAN,
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
  timestamps: true,
  tableName: 'threats',
  underscored: false // Disable underscored since database uses camelCase columns
});

// Define association
Threat.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Threat, { foreignKey: 'userId', as: 'threats' });

module.exports = Threat;

