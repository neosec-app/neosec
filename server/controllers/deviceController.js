const Device = require('../models/Device');
const User = require('../models/User');
const { Op } = require('sequelize');

// Get all devices (admin only)
const getAllDevices = async (req, res) => {
  try {
    const { userId, status } = req.query;

    const where = {};
    if (userId) {
      where.userId = userId;
    }
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const devices = await Device.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email']
        }
      ],
      order: [['lastOnlineAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Get all devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching devices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get devices for a specific user
const getUserDevices = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Admin can view any user's devices, regular users can only view their own
    const targetUserId = req.user.role === 'admin' ? userId : req.user.id;

    const devices = await Device.findAll({
      where: { userId: targetUserId },
      order: [['lastOnlineAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Get user devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user devices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Register or update device
const registerDevice = async (req, res) => {
  try {
    const {
      deviceId,
      deviceName,
      osType,
      osVersion,
      appVersion,
      metadata
    } = req.body;

    if (!deviceId || !deviceName || !osType) {
      return res.status(400).json({
        success: false,
        message: 'deviceId, deviceName, and osType are required'
      });
    }

    const [device, created] = await Device.findOrCreate({
      where: { deviceId, userId: req.user.id },
      defaults: {
        userId: req.user.id,
        deviceId,
        deviceName,
        osType,
        osVersion: osVersion || null,
        appVersion: appVersion || null,
        lastOnlineAt: new Date(),
        metadata: metadata || {}
      }
    });

    if (!created) {
      // Update existing device
      device.deviceName = deviceName;
      device.osType = osType;
      device.osVersion = osVersion || device.osVersion;
      device.appVersion = appVersion || device.appVersion;
      device.lastOnlineAt = new Date();
      device.isActive = true;
      if (metadata) {
        device.metadata = { ...device.metadata, ...metadata };
      }
      await device.save();
    }

    res.status(created ? 201 : 200).json({
      success: true,
      data: device,
      created
    });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error registering device',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update device status
const updateDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { vpnStatus, firewallSyncStatus, isActive } = req.body;

    const device = await Device.findOne({
      where: {
        deviceId,
        userId: req.user.id
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (vpnStatus !== undefined) {
      device.vpnStatus = vpnStatus;
    }
    if (firewallSyncStatus !== undefined) {
      device.firewallSyncStatus = firewallSyncStatus;
      device.lastFirewallSyncAt = new Date();
    }
    if (isActive !== undefined) {
      device.isActive = isActive;
    }
    device.lastOnlineAt = new Date();

    await device.save();

    res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Update device status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating device status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllDevices,
  getUserDevices,
  registerDevice,
  updateDeviceStatus
};

