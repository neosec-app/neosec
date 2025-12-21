const VpnConfig = require('../models/VpnConfig');
const DataTransfer = require('../models/DataTransfer');
const ActivityLog = require('../models/ActivityLog');
const { Op } = require('sequelize');
const { getClientIP } = require('../utils/ipUtils');

// Get all VPN configs for current user
exports.getVpnConfigs = async (req, res) => {
    try {
        const vpnConfigs = await VpnConfig.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'protocol', 'configFileName', 'description', 'isActive', 'createdAt', 'updatedAt']
        });

        res.status(200).json({
            success: true,
            count: vpnConfigs.length,
            data: vpnConfigs
        });
    } catch (error) {
        console.error('Get VPN configs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch VPN configurations'
        });
    }
};

// Get single VPN config (including file content)
exports.getVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        res.status(200).json({
            success: true,
            data: vpnConfig
        });
    } catch (error) {
        console.error('Get VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch VPN configuration'
        });
    }
};

// Create new VPN config with file upload
exports.createVpnConfig = async (req, res) => {
    try {
        const { name, protocol, description, configFileContent, configFileName } = req.body;

        // Validation
        if (!name || !protocol || !configFileContent || !configFileName) {
            return res.status(400).json({
                success: false,
                message: 'Name, protocol, and configuration file are required'
            });
        }

        // Validate protocol
        if (!['OpenVPN', 'WireGuard'].includes(protocol)) {
            return res.status(400).json({
                success: false,
                message: 'Protocol must be either OpenVPN or WireGuard'
            });
        }

        // Validate file extension
        const expectedExtension = protocol === 'OpenVPN' ? '.ovpn' : '.conf';
        if (!configFileName.endsWith(expectedExtension)) {
            return res.status(400).json({
                success: false,
                message: `For ${protocol}, file must have ${expectedExtension} extension`
            });
        }

        // Check if name already exists for this user
        const existingConfig = await VpnConfig.findOne({
            where: {
                name,
                userId: req.user.id
            }
        });

        if (existingConfig) {
            return res.status(409).json({
                success: false,
                message: 'A VPN configuration with this name already exists'
            });
        }

        const vpnConfig = await VpnConfig.create({
            name,
            protocol,
            configFileName,
            configFileContent,
            description: description || null,
            userId: req.user.id,
            isActive: false
        });

        // Return without file content
        const response = {
            id: vpnConfig.id,
            name: vpnConfig.name,
            protocol: vpnConfig.protocol,
            configFileName: vpnConfig.configFileName,
            description: vpnConfig.description,
            isActive: vpnConfig.isActive,
            createdAt: vpnConfig.createdAt,
            updatedAt: vpnConfig.updatedAt
        };

        res.status(201).json({
            success: true,
            message: 'VPN configuration created successfully',
            data: response
        });
    } catch (error) {
        console.error('Create VPN config error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create VPN configuration'
        });
    }
};

// Update VPN config
exports.updateVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        const { name, protocol, description, configFileContent, configFileName } = req.body;

        // Check if name is being changed and if it already exists
        if (name && name !== vpnConfig.name) {
            const existingConfig = await VpnConfig.findOne({
                where: {
                    name,
                    userId: req.user.id,
                    id: { [Op.ne]: vpnConfig.id }
                }
            });

            if (existingConfig) {
                return res.status(409).json({
                    success: false,
                    message: 'A VPN configuration with this name already exists'
                });
            }
        }

        // Validate protocol if provided
        if (protocol && !['OpenVPN', 'WireGuard'].includes(protocol)) {
            return res.status(400).json({
                success: false,
                message: 'Protocol must be either OpenVPN or WireGuard'
            });
        }

        // If file is being updated, validate extension
        if (configFileName && configFileContent) {
            const targetProtocol = protocol || vpnConfig.protocol;
            const expectedExtension = targetProtocol === 'OpenVPN' ? '.ovpn' : '.conf';
            
            if (!configFileName.endsWith(expectedExtension)) {
                return res.status(400).json({
                    success: false,
                    message: `For ${targetProtocol}, file must have ${expectedExtension} extension`
                });
            }
        }

        await vpnConfig.update({
            name: name || vpnConfig.name,
            protocol: protocol || vpnConfig.protocol,
            configFileName: configFileName || vpnConfig.configFileName,
            configFileContent: configFileContent || vpnConfig.configFileContent,
            description: description !== undefined ? description : vpnConfig.description
        });

        // Return without file content
        const response = {
            id: vpnConfig.id,
            name: vpnConfig.name,
            protocol: vpnConfig.protocol,
            configFileName: vpnConfig.configFileName,
            description: vpnConfig.description,
            isActive: vpnConfig.isActive,
            createdAt: vpnConfig.createdAt,
            updatedAt: vpnConfig.updatedAt
        };

        res.status(200).json({
            success: true,
            message: 'VPN configuration updated successfully',
            data: response
        });
    } catch (error) {
        console.error('Update VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update VPN configuration'
        });
    }
};

// Delete VPN config
exports.deleteVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        await vpnConfig.destroy();

        res.status(200).json({
            success: true,
            message: 'VPN configuration deleted successfully'
        });
    } catch (error) {
        console.error('Delete VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete VPN configuration'
        });
    }
};

// Toggle VPN config active status
exports.toggleVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        const wasActive = vpnConfig.isActive;
        const willBeActive = !wasActive;

        // If activating, deactivate all other VPN configs for this user
        if (willBeActive) {
            await VpnConfig.update(
                { isActive: false },
                {
                    where: {
                        userId: req.user.id,
                        id: { [Op.ne]: vpnConfig.id }
                    }
                }
            );
            
            // End any active data transfer sessions if DataTransfer model exists
            try {
                await DataTransfer.update(
                    { isActive: false, sessionEnd: new Date() },
                    {
                        where: {
                            userId: req.user.id,
                            isActive: true
                        }
                    }
                );
                
                // Create new data transfer session
                await DataTransfer.create({
                    userId: req.user.id,
                    vpnConfigId: vpnConfig.id,
                    bytesSent: 0,
                    bytesReceived: 0,
                    sessionStart: new Date(),
                    isActive: true
                });
            } catch (err) {
                console.log('DataTransfer model not available, skipping session management');
            }
            
            // Log VPN connection activity
            try {
                const ipAddress = getClientIP(req);
                await ActivityLog.create({
                    eventType: 'VPN Connection',
                    description: `VPN connected: ${vpnConfig.name} (${vpnConfig.protocol})`,
                    status: 'Success',
                    severity: 'info',
                    userId: req.user.id,
                    ipAddress: ipAddress,
                    metadata: {
                        vpnConfigId: vpnConfig.id,
                        protocol: vpnConfig.protocol,
                        serverAddress: vpnConfig.serverAddress
                    }
                });
            } catch (logError) {
                console.error('Error logging VPN connection:', logError);
            }
        } else {
            // If deactivating, end the current data transfer session
            try {
                await DataTransfer.update(
                    { isActive: false, sessionEnd: new Date() },
                    {
                        where: {
                            userId: req.user.id,
                            vpnConfigId: vpnConfig.id,
                            isActive: true
                        }
                    }
                );
            } catch (err) {
                console.log('DataTransfer model not available, skipping session management');
            }
            
            // Log VPN disconnection activity
            try {
                const ipAddress = getClientIP(req);
                await ActivityLog.create({
                    eventType: 'VPN Disconnection',
                    description: `VPN disconnected: ${vpnConfig.name}`,
                    status: 'Disconnected',
                    severity: 'info',
                    userId: req.user.id,
                    ipAddress: ipAddress,
                    metadata: {
                        vpnConfigId: vpnConfig.id,
                        protocol: vpnConfig.protocol
                    }
                });
            } catch (logError) {
                console.error('Error logging VPN disconnection:', logError);
            }
        }

        await vpnConfig.update({
            isActive: willBeActive
        });

        res.status(200).json({
            success: true,
            message: `VPN configuration ${willBeActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                id: vpnConfig.id,
                name: vpnConfig.name,
                protocol: vpnConfig.protocol,
                configFileName: vpnConfig.configFileName,
                description: vpnConfig.description,
                isActive: vpnConfig.isActive,
                createdAt: vpnConfig.createdAt,
                updatedAt: vpnConfig.updatedAt
            }
        });
    } catch (error) {
        console.error('Toggle VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle VPN configuration'
        });
    }
};

// Clone VPN Configuration
exports.cloneVpnConfig = async (req, res) => {
    try {
        const original = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!original) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        // Generate unique name for clone
        let cloneName = `${original.name} - Copy`;
        let counter = 1;
        
        while (await VpnConfig.findOne({ where: { name: cloneName, userId: req.user.id } })) {
            cloneName = `${original.name} - Copy (${counter})`;
            counter++;
        }

        // Create clone
        const clone = await VpnConfig.create({
            name: cloneName,
            protocol: original.protocol,
            configFileName: original.configFileName,
            configFileContent: original.configFileContent,
            description: original.description,
            isActive: false,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'VPN configuration cloned successfully',
            data: {
                id: clone.id,
                name: clone.name,
                protocol: clone.protocol,
                configFileName: clone.configFileName,
                description: clone.description,
                isActive: clone.isActive,
                createdAt: clone.createdAt,
                updatedAt: clone.updatedAt
            }
        });
    } catch (error) {
        console.error('Clone VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clone VPN configuration'
        });
    }
};

// Download VPN config file
exports.downloadVpnConfig = async (req, res) => {
    try {
        const vpnConfig = await VpnConfig.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!vpnConfig) {
            return res.status(404).json({
                success: false,
                message: 'VPN configuration not found'
            });
        }

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${vpnConfig.configFileName}"`);
        res.send(vpnConfig.configFileContent);
    } catch (error) {
        console.error('Download VPN config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download VPN configuration'
        });
    }
};