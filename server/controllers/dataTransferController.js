const DataTransfer = require('../models/DataTransfer');
const VpnConfig = require('../models/VpnConfig');

// @desc    Update data transfer for active VPN session
// @route   POST /api/data-transfer/update
// @access  Private
const updateDataTransfer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bytesSent, bytesReceived } = req.body;

    // Find active VPN config for this user
    const activeVpn = await VpnConfig.findOne({
      where: {
        userId: userId,
        isActive: true
      }
    });

    if (!activeVpn) {
      return res.status(400).json({
        success: false,
        message: 'No active VPN connection'
      });
    }

    // Find or create active data transfer session
    let dataTransfer = await DataTransfer.findOne({
      where: {
        userId: userId,
        vpnConfigId: activeVpn.id,
        isActive: true
      }
    });

    if (!dataTransfer) {
      dataTransfer = await DataTransfer.create({
        userId: userId,
        vpnConfigId: activeVpn.id,
        bytesSent: bytesSent || 0,
        bytesReceived: bytesReceived || 0,
        sessionStart: new Date(),
        isActive: true
      });
    } else {
      // Update existing session
      await dataTransfer.update({
        bytesSent: (dataTransfer.bytesSent || 0) + (bytesSent || 0),
        bytesReceived: (dataTransfer.bytesReceived || 0) + (bytesReceived || 0)
      });
    }

    res.status(200).json({
      success: true,
      data: dataTransfer
    });
  } catch (error) {
    console.error('Update data transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating data transfer'
    });
  }
};

// @desc    Get data transfer statistics
// @route   GET /api/data-transfer/stats
// @access  Private
const getDataTransferStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const { sequelize } = require('../config/db');
    const stats = await DataTransfer.findAll({
      where: {
        userId: userId
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('bytesSent')), 'totalBytesSent'],
        [sequelize.fn('SUM', sequelize.col('bytesReceived')), 'totalBytesReceived']
      ],
      raw: true
    });

    const totalBytesSent = BigInt(stats[0]?.totalBytesSent || 0);
    const totalBytesReceived = BigInt(stats[0]?.totalBytesReceived || 0);
    const bytesPerGB = 1073741824;
    const gbSent = Number(totalBytesSent) / bytesPerGB;
    const gbReceived = Number(totalBytesReceived) / bytesPerGB;

    res.status(200).json({
      success: true,
      data: {
        bytesSent: Number(totalBytesSent),
        bytesReceived: Number(totalBytesReceived),
        gbSent: parseFloat(gbSent.toFixed(2)),
        gbReceived: parseFloat(gbReceived.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Get data transfer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching data transfer stats'
    });
  }
};

module.exports = {
  updateDataTransfer,
  getDataTransferStats
};

