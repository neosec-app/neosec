const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ThreatBlockerSettings = sequelize.define('ThreatBlockerSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'threat_blocker_settings',
  timestamps: true,
  underscored: false
});

module.exports = ThreatBlockerSettings;

