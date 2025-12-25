const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [6, 100] // Minimum 6 characters
        }
    },
    isApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
        // With underscored: false, Sequelize will use 'isApproved' directly
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false
    },
    accountType: {
        type: DataTypes.ENUM('user', 'leader', 'admin'),
        defaultValue: 'user',
        allowNull: false
        // With underscored: false, Sequelize will use 'accountType' directly
    },
    subscriptionTier: {
        type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
        defaultValue: 'free',
        allowNull: false
        // With underscored: false, Sequelize will use 'subscriptionTier' directly
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
        // With underscored: false, Sequelize will use 'isPaid' directly
    }
}, {
    tableName: 'users',
    timestamps: true,
    // Note: Database has camelCase columns (isApproved, accountType, etc.)
    // but timestamps might be snake_case (created_at, updated_at)
    // We'll handle this with explicit field mappings where needed
    underscored: false, // Disable underscored for User model to match existing camelCase columns
    hooks: {
        // Hash password before creating user
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        // Hash password before updating if it changed
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to compare password
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user data without password
User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
};

module.exports = User;