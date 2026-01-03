const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const RoleTemplate = sequelize.define('RoleTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
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
  tableName: 'role_templates',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['is_system'] }
  ]
});

RoleTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = RoleTemplate;

