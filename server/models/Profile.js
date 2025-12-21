const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Profile = sequelize.define('Profile', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profileType: {
    type: DataTypes.ENUM('Work Mode', 'Public WiFi Mode', 'Home Mode', 'Custom'),
    defaultValue: 'Custom',
    allowNull: false
  },
  
  // VPN Settings
  vpnEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  vpnServer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vpnProtocol: {
    type: DataTypes.ENUM('OpenVPN', 'WireGuard', 'IKEv2'),
    allowNull: true
  },
  vpnPort: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  vpnUsername: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Firewall Settings
  firewallEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  firewallRules: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  defaultFirewallAction: {
    type: DataTypes.ENUM('ALLOW', 'DENY'),
    defaultValue: 'DENY'
  },
  
  
  // Scheduling
  isScheduled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scheduleType: {
    type: DataTypes.ENUM('TIME', 'CONDITION', 'BOTH', 'NONE'),
    defaultValue: 'NONE'
  },
  scheduleStartTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  scheduleEndTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  scheduleDays: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  scheduleCondition: {
    type: DataTypes.STRING,
    allowNull: true
  },
  autoActivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  geoLocationCountries: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of country names where profile should auto-activate'
  },
  
  
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastActivatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  lastConditionMet: {
    type: DataTypes.STRING,
    allowNull: true
  }

}, {
  tableName: 'profiles',
  timestamps: true
});

module.exports = Profile;