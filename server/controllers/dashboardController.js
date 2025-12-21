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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const userId = req.user.id;
    console.log('dashboard: userId=', userId);

    // Get user's active VPN config
    let activeVpn = null;
    try {
      activeVpn = await VpnConfig.findOne({
        where: {
          userId: userId,
          isActive: true
        }
      });
      console.log('dashboard: activeVpn=', !!activeVpn);
    } catch (vpnError) {
      console.error('Error getting active VPN:', vpnError);
    }

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

    let threatsThisWeek = 0;
    let threatsLastWeek = 0;
    
    try {
      threatsThisWeek = await Threat.count({
        where: {
          userId: userId,
          blocked: true,
          createdAt: {
            [Op.gte]: oneWeekAgo
          }
        }
      });

      threatsLastWeek = await Threat.count({
        where: {
          userId: userId,
          blocked: true,
          createdAt: {
            [Op.gte]: lastWeekAgo,
            [Op.lt]: oneWeekAgo
          }
        }
      });
    } catch (threatError) {
      console.error('Error counting threats:', threatError);
      // Continue with zero values
    }

    // Calculate percentage change
    const percentageChange = threatsLastWeek > 0 
      ? Math.round(((threatsThisWeek - threatsLastWeek) / threatsLastWeek) * 100)
      : threatsThisWeek > 0 ? 100 : 0;

    // Get total unique blocked IPs
    let uniqueBlockedIPs = [];
    try {
      uniqueBlockedIPs = await Threat.findAll({
        where: {
          userId: userId,
          blocked: true,
          sourceIp: { [Op.ne]: null }
        },
        attributes: ['sourceIp'],
        group: ['sourceIp']
      });
    } catch (uniqueIPsError) {
      console.error('Error getting unique blocked IPs:', uniqueIPsError);
      // Continue with empty array
    }

    // Get active profile
    let activeProfile = null;
    try {
      activeProfile = await Profile.findOne({
        where: {
          userId: userId,
          isActive: true
        }
      });
    } catch (profileError) {
      console.error('Error getting active profile:', profileError);
    }

    // Get recent activity logs (combine threats and notifications)
    const oneWeekAgoForLogs = new Date();
    oneWeekAgoForLogs.setDate(oneWeekAgoForLogs.getDate() - 7);

    let recentThreats = [];
    try {
      recentThreats = await Threat.findAll({
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
    } catch (recentThreatsError) {
      console.error('Error getting recent threats:', recentThreatsError);
    }

    let recentNotifications = [];
    try {
      recentNotifications = await Notification.findAll({
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
    } catch (notificationsError) {
      console.error('Error getting recent notifications:', notificationsError);
    }

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
    let totalBytesSent = BigInt(0);
    let totalBytesReceived = BigInt(0);
    
    try {
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
      
      if (sentValue !== null && sentValue !== undefined) {
        totalBytesSent = BigInt(String(sentValue));
      }
      if (receivedValue !== null && receivedValue !== undefined) {
        totalBytesReceived = BigInt(String(receivedValue));
      }
    } catch (dataTransferError) {
      console.error('Error calculating data transfer stats:', dataTransferError);
      // Continue with zero values if query fails
    }
    
    // Convert bytes to GB (1 GB = 1,073,741,824 bytes)
    const bytesPerGB = 1073741824;
    const gbSent = Number(totalBytesSent) / bytesPerGB;
    const gbReceived = Number(totalBytesReceived) / bytesPerGB;
    
    // Calculate progress percentages (assuming max of 10GB for visualization, or use actual max)
    const maxGB = 10; // Maximum for progress bar visualization
    const sentPercentage = Math.min((gbSent / maxGB) * 100, 100);
    const receivedPercentage = Math.min((gbReceived / maxGB) * 100, 100);

    // Calculate additional threat counts
    let last24HoursThreats = 0;
    let totalThreats = 0;
    
    try {
      last24HoursThreats = await Threat.count({
        where: {
          userId: userId,
          blocked: true,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
    } catch (err) {
      console.error('Error counting last24Hours threats:', err);
    }
    
    try {
      totalThreats = await Threat.count({
        where: {
          userId: userId,
          blocked: true
        }
      });
    } catch (err) {
      console.error('Error counting total threats:', err);
    }

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
          last24Hours: last24HoursThreats,
          total: totalThreats
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
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
};

module.exports = {
  getDashboard
};

