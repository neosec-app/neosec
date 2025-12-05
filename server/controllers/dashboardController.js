const { Op } = require('sequelize');
const User = require('../models/User');
const VpnConfig = require('../models/VpnConfig');
const Threat = require('../models/Threat');

// @desc    Get dashboard data (VPN status and threats blocked)
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's active VPN config
    const activeVpn = await VpnConfig.findOne({
      where: {
        userId: userId,
        isActive: true
      }
    });

    // Get threats blocked count for this user (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const threatsBlocked = await Threat.count({
      where: {
        userId: userId,
        blocked: true,
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      }
    });

    // Get total threats blocked for this user
    const totalThreatsBlocked = await Threat.count({
      where: {
        userId: userId,
        blocked: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        vpnStatus: {
          connected: !!activeVpn,
          server: activeVpn ? activeVpn.serverAddress : null,
          protocol: activeVpn ? activeVpn.protocol : null,
          configName: activeVpn ? activeVpn.name : null
        },
        threatsBlocked: {
          last24Hours: threatsBlocked,
          total: totalThreatsBlocked
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboard
};

