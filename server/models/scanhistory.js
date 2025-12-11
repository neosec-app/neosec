const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class ScanHistory extends Model {}

ScanHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    scanType: {
      type: DataTypes.ENUM('FILE', 'URL', 'IP'),
      allowNull: false
    },
    target: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileHash: {
      type: DataTypes.STRING
    },
    scanId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SCANNING', 'COMPLETED', 'ERROR'),
      defaultValue: 'PENDING'
    },
    positives: DataTypes.INTEGER,
    total: DataTypes.INTEGER,
    permalink: DataTypes.STRING,
    scanDate: DataTypes.DATE
  },
  {
    sequelize,
    modelName: 'ScanHistory',
    tableName: 'scan_histories'
  }
);

module.exports = ScanHistory;
