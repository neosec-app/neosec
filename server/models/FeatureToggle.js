const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Group = require('./Group');

const FeatureToggle = sequelize.define('FeatureToggle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  featureName: {
    type: DataTypes.ENUM(
      'firewall_editing',
      'vpn_config_modification',
      'profile_sharing',
      'scheduled_rules',
      'advanced_threat_detection',
      'device_management'
    ),
    allowNull: false
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  targetType: {
    type: DataTypes.ENUM('all', 'user', 'group', 'role'),
    defaultValue: 'all',
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  targetRole: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'feature_toggles',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['feature_name'] },
    { fields: ['target_type', 'target_id'] },
    { fields: ['enabled'] }
  ]
});

FeatureToggle.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
FeatureToggle.belongsTo(User, { foreignKey: 'targetId', as: 'targetUser', constraints: false });
FeatureToggle.belongsTo(Group, { foreignKey: 'targetId', as: 'targetGroup', constraints: false });

module.exports = FeatureToggle;

