const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const VpnConfig = require('./VpnConfig');

const DataTransfer = sequelize.define('DataTransfer', {
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
  vpnConfigId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'vpn_configs',
      key: 'id'
    }
  },
  bytesSent: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  bytesReceived: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  sessionStart: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  sessionEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'data_transfers',
  timestamps: true,
  underscored: false // Disable underscored since database uses camelCase columns
});

// Associations
DataTransfer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DataTransfer.belongsTo(VpnConfig, { foreignKey: 'vpnConfigId', as: 'vpnConfig' });
User.hasMany(DataTransfer, { foreignKey: 'userId', as: 'dataTransfers' });
VpnConfig.hasMany(DataTransfer, { foreignKey: 'vpnConfigId', as: 'dataTransfers' });

module.exports = DataTransfer;

