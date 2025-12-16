const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BlocklistIP = sequelize.define('BlocklistIP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isIP: true
    }
  },
  threatType: {
    type: DataTypes.ENUM(
      'Malware C&C',
      'Botnet',
      'Brute Force',
      'Malware Host',
      'Phishing',
      'DDoS',
      'Spam',
      'Exploit',
      'Suspicious',
      'Other'
    ),
    allowNull: false,
    defaultValue: 'Other'
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'AbuseIPDB'
  },
  confidence: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  country: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  countryName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true
  },
  abuseConfidenceScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  usageType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hostnames: {
    type: DataTypes.JSON,
    allowNull: true
  },
  totalReports: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  numDistinctUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'blocklist_ips',
  indexes: [
    { fields: ['ipAddress'], unique: true },
    { fields: ['threatType'] },
    { fields: ['source'] },
    { fields: ['country'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = BlocklistIP;


