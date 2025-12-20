const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('../models/User');
const VpnConfig = require('../models/VpnConfig');
const Threat = require('../models/Threat');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const DataTransfer = require('../models/DataTransfer');

// Helper to format time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// @desc    Get dashboard data (VPN status and threats blocked)
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('dashboard: userId=', userId);

    // Get user's active VPN config
    const activeVpn = await VpnConfig.findOne({
      where: {
        userId: userId,
        isActive: true
      }
    });
    console.log('dashboard: activeVpn=', !!activeVpn);

    // Calculate connection time if VPN is active
    let connectionTime = null;
    if (activeVpn && activeVpn.updatedAt) {
      const now = new Date();
      const connectedAt = new Date(activeVpn.updatedAt);
      const diffMs = now - connectedAt;
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      connectionTime = `${hours}h ${minutes}m`;
    }
    console.log('dashboard: connectionTime=', connectionTime);

    // Get threats blocked count for this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const lastWeekAgo = new Date();
    lastWeekAgo.setDate(lastWeekAgo.getDate() - 14);

    const threatsThisWeek = await Threat.count({
      where: {
        userId: userId,
        blocked: true,
        createdAt: {
          [Op.gte]: oneWeekAgo
        }
      }
    });

    const threatsLastWeek = await Threat.count({
      where: {
        userId: userId,
        blocked: true,
        createdAt: {
          [Op.gte]: lastWeekAgo,
          [Op.lt]: oneWeekAgo
        }
      }
    });

    // Calculate percentage change
    const percentageChange = threatsLastWeek > 0 
      ? Math.round(((threatsThisWeek - threatsLastWeek) / threatsLastWeek) * 100)
      : threatsThisWeek > 0 ? 100 : 0;

    // Get total unique blocked IPs
    const uniqueBlockedIPs = await Threat.findAll({
      where: {
        userId: userId,
        blocked: true,
        sourceIp: { [Op.ne]: null }
      },
      attributes: ['sourceIp'],
      group: ['sourceIp']
    });

    // Get active profile
    const activeProfile = await Profile.findOne({
      where: {
        userId: userId,
        isActive: true
      }
    });

    // Get recent activity logs (combine threats and notifications)
    const oneWeekAgoForLogs = new Date();
    oneWeekAgoForLogs.setDate(oneWeekAgoForLogs.getDate() - 7);

    const recentThreats = await Threat.findAll({
      where: {
        userId: userId,
        blocked: true,
        createdAt: {
          [Op.gte]: oneWeekAgoForLogs
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'sourceIp', 'description', 'threatType', 'createdAt']
    });

    const recentNotifications = await Notification.findAll({
      where: {
        userId: userId,
        createdAt: {
          [Op.gte]: oneWeekAgoForLogs
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'title', 'message', 'eventType', 'createdAt']
    });

    // Combine and sort activities
    const activities = [
      ...recentThreats.map(t => ({
        id: t.id,
        type: 'threat',
        message: t.description || `Blocked connection from ${t.sourceIp || 'unknown IP'}`,
        timestamp: t.createdAt,
        isBlocked: true
      })),
      ...recentNotifications.map(n => ({
        id: n.id,
        type: 'notification',
        message: n.message || n.title,
        timestamp: n.createdAt,
        isBlocked: n.eventType ? (n.eventType.includes('error') || n.eventType.includes('failed')) : false
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    // Calculate data transfer totals
    const dataTransferStats = await DataTransfer.findAll({
      where: {
        userId: userId
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('bytesSent')), 'totalBytesSent'],
        [sequelize.fn('SUM', sequelize.col('bytesReceived')), 'totalBytesReceived']
      ],
      raw: true
    });
    console.log('dashboard: dataTransferStats=', dataTransferStats);

    const sentValue = dataTransferStats[0]?.totalBytesSent ?? null;
    const receivedValue = dataTransferStats[0]?.totalBytesReceived ?? null;
    const totalBytesSent = BigInt(sentValue ? String(sentValue) : '0');
    const totalBytesReceived = BigInt(receivedValue ? String(receivedValue) : '0');
    
    // Convert bytes to GB (1 GB = 1,073,741,824 bytes)
    const bytesPerGB = 1073741824;
    const gbSent = Number(totalBytesSent) / bytesPerGB;
    const gbReceived = Number(totalBytesReceived) / bytesPerGB;
    
    // Calculate progress percentages (assuming max of 10GB for visualization, or use actual max)
    const maxGB = 10; // Maximum for progress bar visualization
    const sentPercentage = Math.min((gbSent / maxGB) * 100, 100);
    const receivedPercentage = Math.min((gbReceived / maxGB) * 100, 100);

    res.status(200).json({
      success: true,
      data: {
        vpnStatus: {
          connected: !!activeVpn,
          server: activeVpn ? activeVpn.serverAddress : null,
          protocol: activeVpn ? activeVpn.protocol : null,
          configName: activeVpn ? activeVpn.name : null,
          serverLocation: activeVpn ? (activeVpn.description || 'Unknown Location') : null,
          ipAddress: activeVpn ? '192.168.1.50' : null, // Placeholder - would need actual connection IP
          connectionTime: connectionTime
        },
        threatsBlocked: {
          thisWeek: threatsThisWeek,
          percentageChange: percentageChange,
          totalBlockedIPs: uniqueBlockedIPs.length || 0,
          last24Hours: await Threat.count({
            where: {
              userId: userId,
              blocked: true,
              createdAt: {
                [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          }),
          total: await Threat.count({
            where: {
              userId: userId,
              blocked: true
            }
          })
        },
        activeProfile: activeProfile ? {
          name: activeProfile.name,
          description: activeProfile.description || 'High security settings enabled',
          profileType: activeProfile.profileType
        } : null,
        dataTransfer: {
          bytesSent: Number(totalBytesSent),
          bytesReceived: Number(totalBytesReceived),
          gbSent: parseFloat(gbSent.toFixed(2)),
          gbReceived: parseFloat(gbReceived.toFixed(2)),
          sentPercentage: parseFloat(sentPercentage.toFixed(1)),
          receivedPercentage: parseFloat(receivedPercentage.toFixed(1))
        },
        recentActivities: activities.map(a => ({
          id: a.id,
          message: a.message,
          timestamp: a.timestamp,
          timeAgo: getTimeAgo(new Date(a.timestamp)),
          isBlocked: a.isBlocked
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    console.error(error && error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? (error.message || String(error)) : undefined
    });
  }
};

module.exports = {
  getDashboard
};

