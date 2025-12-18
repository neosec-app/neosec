const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const crypto = require('crypto');

const SharedProfile = sequelize.define('SharedProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'profiles',
      key: 'id'
    }
  },
  profileSnapshot: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Sanitized immutable snapshot of the profile at share creation time'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  shareToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  encryptedPassword: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permissions: {
    type: DataTypes.ENUM('VIEW', 'IMPORT'),
    defaultValue: 'VIEW',
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  maxAccess: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum number of times this link can be accessed'
  },
  accessCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  revokedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'shared_profiles',
  timestamps: true,
  hooks: {
    beforeCreate: (sharedProfile) => {
      if (!sharedProfile.shareToken) {
        sharedProfile.shareToken = crypto.randomBytes(32).toString('hex');
      }
    }
  }
});

module.exports = SharedProfile;