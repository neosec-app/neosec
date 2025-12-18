module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create shared_profiles table
    await queryInterface.createTable('shared_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profileId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      shareToken: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      encryptedPassword: {
        type: Sequelize.STRING,
        allowNull: true
      },
      permissions: {
        type: Sequelize.ENUM('VIEW', 'IMPORT'),
        defaultValue: 'VIEW',
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      maxAccess: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      accessCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastAccessedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      revokedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      revokedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create shared_profile_logs table
    await queryInterface.createTable('shared_profile_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sharedProfileId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'shared_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.ENUM(
          'CREATED',
          'VIEWED',
          'IMPORTED',
          'REVOKED',
          'EXPIRED',
          'ACCESS_DENIED',
          'PASSWORD_FAILED'
        ),
        allowNull: false
      },
      accessorEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('shared_profiles', ['shareToken']);
    await queryInterface.addIndex('shared_profiles', ['profileId']);
    await queryInterface.addIndex('shared_profiles', ['userId']);
    await queryInterface.addIndex('shared_profile_logs', ['sharedProfileId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('shared_profile_logs');
    await queryInterface.dropTable('shared_profiles');
  }
};