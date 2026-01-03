const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const VpnConfig = sequelize.define('VpnConfig', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    protocol: {
        type: DataTypes.ENUM('OpenVPN', 'WireGuard'),
        allowNull: false,
        defaultValue: 'OpenVPN'
    },
    configFileName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Original filename (.ovpn or .conf)'
    },
    configFileContent: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: 'Content of the configuration file'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    serverAddress: {
        type: DataTypes.STRING,
        allowNull: true, // Make it nullable to avoid constraint errors
        comment: 'VPN server address extracted from config file'
    },
    port: {
        type: DataTypes.INTEGER,
        allowNull: true, // Make it nullable to avoid constraint errors
        comment: 'VPN server port extracted from config file'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
     //   field:'isactive'
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    tableName: 'vpn_configs',
    underscored: false // Disable underscored since database uses camelCase columns
});

// Define association
VpnConfig.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = VpnConfig;
