const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('../models/User');
const VpnConfig = require('../models/VpnConfig');
const Threat = require('../models/Threat');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const DataTransfer = require('../models/DataTransfer');
const ActivityLog = require('../models/ActivityLog');
const BlocklistIP = require('../models/BlocklistIP');
const GroupMember = require('../models/GroupMember');
const Device = require('../models/Device');
const LoginHistory = require('../models/LoginHistory');
const { getClientIP } = require('../utils/ipUtils');

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

// Helper to format inactive time
const formatInactiveTime = (minutes) => {
  if (minutes < 60) {
    return `${Math.floor(minutes)}m ago`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  }
};

// Helper to get active users
const getActiveUsers = async (userId, userRole) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const now = new Date();
  
  if (userRole === 'admin') {
    // Admins see all active users
    // Get all devices (both active and inactive within 1 hour)
    const allDevices = await Device.findAll({
      where: {
        lastOnlineAt: { [Op.gte]: oneHourAgo },
        isActive: true
      },
      attributes: ['userId', 'lastOnlineAt'],
      order: [['lastOnlineAt', 'DESC']]
    });
    
    // Get device user IDs
    const deviceUserIds = [...new Set(allDevices.map(d => d.userId).filter(id => id && id !== userId))];
    
    // Get login history for users without devices or as fallback
    const recentLogins = await LoginHistory.findAll({
      where: {
        success: true,
        createdAt: { [Op.gte]: oneHourAgo }
      },
      attributes: ['userId', 'createdAt'],
      raw: true,
      order: [['createdAt', 'DESC']]
    });
    
    // Combine user IDs from devices and logins
    const allUserIds = [...new Set([
      ...deviceUserIds,
      ...recentLogins.map(l => l.userId).filter(id => id && id !== userId)
    ])];
    
    if (allUserIds.length === 0) {
      return [];
    }
    
    // Get users with approved accounts
    const users = await User.findAll({
      where: { 
        id: { [Op.in]: allUserIds },
        isApproved: true
      },
      attributes: ['id', 'email', 'role', 'accountType']
    });
    
    // Enrich users with status information
    const usersWithStatus = users.map(user => {
      // Find most recent device activity
      const userDevices = allDevices.filter(d => d.userId === user.id);
      const mostRecentDevice = userDevices.length > 0 
        ? userDevices.reduce((latest, current) => 
            current.lastOnlineAt > latest.lastOnlineAt ? current : latest
          )
        : null;
      
      // Find most recent login
      const userLogins = recentLogins.filter(l => l.userId === user.id);
      const mostRecentLogin = userLogins.length > 0
        ? userLogins.reduce((latest, current) => 
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
        : null;
      
      // Determine status - use MOST RECENT activity (device OR login)
      let isActive = false;
      let inactiveDuration = null;
      let statusText = 'now';
      
      // Get timestamps for both device and login
      const deviceTime = mostRecentDevice ? new Date(mostRecentDevice.lastOnlineAt) : null;
      const loginTime = mostRecentLogin ? new Date(mostRecentLogin.createdAt) : null;
      
      // Use the most recent activity (whichever is newer)
      let mostRecentTime = null;
      if (deviceTime && loginTime) {
        mostRecentTime = deviceTime > loginTime ? deviceTime : loginTime;
      } else if (deviceTime) {
        mostRecentTime = deviceTime;
      } else if (loginTime) {
        mostRecentTime = loginTime;
      }
      
      if (mostRecentTime) {
        const minutesAgo = (now - mostRecentTime) / (1000 * 60);
        if (minutesAgo <= 5) {
          isActive = true;
          statusText = 'now';
        } else {
          isActive = false;
          inactiveDuration = minutesAgo;
          statusText = formatInactiveTime(minutesAgo);
        }
      }
      
      // Only include users inactive for less than 1 hour
      if (inactiveDuration !== null && inactiveDuration >= 60) {
        return null; // Filter out users inactive > 1 hour
      }
      
      return {
        ...user.toJSON(),
        isActive,
        inactiveDuration,
        statusText
      };
    }).filter(u => u !== null) // Remove null entries
      .sort((a, b) => {
        // Sort: Active users first (green), then inactive users (yellow)
        // Within each group, sort by most recent activity first
        if (a.isActive !== b.isActive) {
          return b.isActive - a.isActive; // true (1) comes before false (0)
        }
        // If both have same status, sort by inactiveDuration (lower = more recent)
        const aDuration = a.inactiveDuration || 0;
        const bDuration = b.inactiveDuration || 0;
        return aDuration - bDuration;
      });
    
    return usersWithStatus;
  } else {
    // Regular users see only active users in their groups
    const userGroups = await GroupMember.findAll({
      where: {
        userId: userId,
        status: 'accepted'
      },
      attributes: ['groupId']
    });
    
    if (userGroups.length === 0) {
      return [];
    }
    
    const groupIds = userGroups.map(gm => gm.groupId);
    
    // Get all members of user's groups
    const groupMembers = await GroupMember.findAll({
      where: {
        groupId: { [Op.in]: groupIds },
        status: 'accepted',
        userId: { [Op.ne]: userId }
      },
      attributes: ['userId']
    });
    
    const memberUserIds = [...new Set(groupMembers.map(gm => gm.userId))];
    
    if (memberUserIds.length === 0) {
      return [];
    }
    
    // Get all devices for group members (within 1 hour)
    const allDevices = await Device.findAll({
      where: {
        userId: { [Op.in]: memberUserIds },
        lastOnlineAt: { [Op.gte]: oneHourAgo },
        isActive: true
      },
      attributes: ['userId', 'lastOnlineAt'],
      order: [['lastOnlineAt', 'DESC']]
    });
    
    // Get login history for group members
    const recentLogins = await LoginHistory.findAll({
      where: {
        userId: { [Op.in]: memberUserIds },
        success: true,
        createdAt: { [Op.gte]: oneHourAgo }
      },
      attributes: ['userId', 'createdAt'],
      raw: true,
      order: [['createdAt', 'DESC']]
    });
    
    // Combine user IDs
    const allUserIds = [...new Set([
      ...allDevices.map(d => d.userId),
      ...recentLogins.map(l => l.userId)
    ])];
    
    if (allUserIds.length === 0) {
      return [];
    }
    
    const users = await User.findAll({
      where: { id: { [Op.in]: allUserIds } },
      attributes: ['id', 'email', 'role', 'accountType']
    });
    
    // Enrich users with status information
    const usersWithStatus = users.map(user => {
      // Find most recent device activity
      const userDevices = allDevices.filter(d => d.userId === user.id);
      const mostRecentDevice = userDevices.length > 0 
        ? userDevices.reduce((latest, current) => 
            current.lastOnlineAt > latest.lastOnlineAt ? current : latest
          )
        : null;
      
      // Find most recent login
      const userLogins = recentLogins.filter(l => l.userId === user.id);
      const mostRecentLogin = userLogins.length > 0
        ? userLogins.reduce((latest, current) => 
            new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
          )
        : null;
      
      // Determine status - use MOST RECENT activity (device OR login)
      let isActive = false;
      let inactiveDuration = null;
      let statusText = 'now';
      
      // Get timestamps for both device and login
      const deviceTime = mostRecentDevice ? new Date(mostRecentDevice.lastOnlineAt) : null;
      const loginTime = mostRecentLogin ? new Date(mostRecentLogin.createdAt) : null;
      
      // Use the most recent activity (whichever is newer)
      let mostRecentTime = null;
      if (deviceTime && loginTime) {
        mostRecentTime = deviceTime > loginTime ? deviceTime : loginTime;
      } else if (deviceTime) {
        mostRecentTime = deviceTime;
      } else if (loginTime) {
        mostRecentTime = loginTime;
      }
      
      if (mostRecentTime) {
        const minutesAgo = (now - mostRecentTime) / (1000 * 60);
        if (minutesAgo <= 5) {
          isActive = true;
          statusText = 'now';
        } else {
          isActive = false;
          inactiveDuration = minutesAgo;
          statusText = formatInactiveTime(minutesAgo);
        }
      }
      
      // Only include users inactive for less than 1 hour
      if (inactiveDuration !== null && inactiveDuration >= 60) {
        return null; // Filter out users inactive > 1 hour
      }
      
      return {
        ...user.toJSON(),
        isActive,
        inactiveDuration,
        statusText
      };
    }).filter(u => u !== null) // Remove null entries
      .sort((a, b) => {
        // Sort: Active users first (green), then inactive users (yellow)
        // Within each group, sort by most recent activity first
        if (a.isActive !== b.isActive) {
          return b.isActive - a.isActive; // true (1) comes before false (0)
        }
        // If both have same status, sort by inactiveDuration (lower = more recent)
        const aDuration = a.inactiveDuration || 0;
        const bDuration = b.inactiveDuration || 0;
        return aDuration - bDuration;
      });
    
    return usersWithStatus;
  }
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

    // Update user activity (heartbeat) - track that user is actively using the app
    // This ensures users who stay logged in show as active
    try {
      // Update or create device activity as heartbeat
      const [device] = await Device.findOrCreate({
        where: {
          userId: userId,
          deviceId: `web-${userId}` // Use a default web device ID
        },
        defaults: {
          userId: userId,
          deviceId: `web-${userId}`,
          deviceName: 'Web Browser',
          osType: 'Windows', // Default, can be improved with user-agent detection
          lastOnlineAt: new Date(),
          isActive: true
        }
      });

      // Update lastOnlineAt if device exists (heartbeat)
      if (!device.isNewRecord) {
        device.lastOnlineAt = new Date();
        device.isActive = true;
        await device.save();
      }
    } catch (heartbeatError) {
      // Don't fail dashboard if heartbeat fails
      console.error('Error updating user activity heartbeat:', heartbeatError);
    }

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
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    let threatsThisWeek = 0;
    let threatsLastWeek = 0;
    let last24HoursThreats = 0;
    let totalThreats = 0;
    
    try {
      // Count from Threat table (actual blocked threats)
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

      last24HoursThreats = await Threat.count({
        where: {
          userId: userId,
          blocked: true,
          createdAt: {
            [Op.gte]: oneDayAgo
          }
        }
      });

      totalThreats = await Threat.count({
        where: {
          userId: userId,
          blocked: true
        }
      });

      // Also count from ActivityLog for more accurate blocking stats
      // This includes blocks even when user wasn't authenticated
      const activityLogThreatsThisWeek = await ActivityLog.count({
        where: {
          eventType: 'Blocked Threat',
          status: 'Blocked',
          createdAt: {
            [Op.gte]: oneWeekAgo
          },
          // Include system blocks (userId is null) or user-specific blocks
          [Op.or]: [
            { userId: userId },
            { userId: null } // System-wide blocks
          ]
        }
      });

      // Use the higher count (ActivityLog is more comprehensive)
      if (activityLogThreatsThisWeek > threatsThisWeek) {
        threatsThisWeek = activityLogThreatsThisWeek;
      }

      const activityLogThreatsLast24h = await ActivityLog.count({
        where: {
          eventType: 'Blocked Threat',
          status: 'Blocked',
          createdAt: {
            [Op.gte]: oneDayAgo
          },
          [Op.or]: [
            { userId: userId },
            { userId: null }
          ]
        }
      });

      if (activityLogThreatsLast24h > last24HoursThreats) {
        last24HoursThreats = activityLogThreatsLast24h;
      }
    } catch (threatError) {
      console.error('Error counting threats:', threatError);
      // Continue with zero values
    }

    // Calculate percentage change
    const percentageChange = threatsLastWeek > 0 
      ? Math.round(((threatsThisWeek - threatsLastWeek) / threatsLastWeek) * 100)
      : threatsThisWeek > 0 ? 100 : 0;

    // Get total unique blocked IPs from both Threat table and BlocklistIP table
    let uniqueBlockedIPs = [];
    let totalBlocklistIPs = 0;
    
    try {
      // Get unique IPs from Threat table (actually blocked)
      uniqueBlockedIPs = await Threat.findAll({
        where: {
          userId: userId,
          blocked: true,
          sourceIp: { [Op.ne]: null }
        },
        attributes: ['sourceIp'],
        group: ['sourceIp']
      });

      // Also get total IPs in blocklist (available to block)
      totalBlocklistIPs = await BlocklistIP.count();
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

    // Get recent activity logs (combine threats, notifications, and activity logs)
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

    // Get ActivityLog entries (VPN, Firewall, Profile activities, etc.)
    let recentActivityLogs = [];
    try {
      recentActivityLogs = await ActivityLog.findAll({
        where: {
          userId: userId,
          createdAt: {
            [Op.gte]: oneWeekAgoForLogs
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 15, // Get more to account for filtering
        attributes: ['id', 'eventType', 'description', 'status', 'severity', 'createdAt']
      });
    } catch (activityLogError) {
      console.error('Error getting recent activity logs:', activityLogError);
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
      })),
      ...recentActivityLogs.map(log => ({
        id: log.id,
        type: log.eventType.toLowerCase().replace(/\s+/g, '_'), // e.g., 'vpn_connection', 'firewall_rule_update'
        message: log.description,
        timestamp: log.createdAt,
        isBlocked: log.status === 'Blocked' || log.severity === 'critical',
        eventType: log.eventType,
        status: log.status
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

    // Note: last24HoursThreats and totalThreats are already calculated above

    // Get client IP address (actual connection IP when VPN is active)
    let clientIP = null;
    if (activeVpn) {
      try {
        clientIP = getClientIP(req);
        // If it's localhost in development, use server address as fallback
        if (clientIP === '127.0.0.1 (Local Development)' || clientIP === '127.0.0.1' || clientIP === 'unknown') {
          clientIP = activeVpn.serverAddress || null;
        }
      } catch (ipError) {
        console.error('Error getting client IP:', ipError);
        // Fallback to server address
        clientIP = activeVpn.serverAddress || null;
      }
    }

    // Get active users
    let activeUsers = [];
    try {
      console.log(`dashboard: Getting active users for user ${userId}, role: ${req.user.role}`);
      activeUsers = await getActiveUsers(userId, req.user.role);
      console.log(`dashboard: Found ${activeUsers.length} active users for ${req.user.role}`);
      if (activeUsers.length > 0) {
        console.log(`dashboard: Active users:`, activeUsers.map(u => u.email));
      } else {
        console.log(`dashboard: No active users found (current user ${userId} is excluded)`);
      }
    } catch (activeUsersError) {
      console.error('Error getting active users:', activeUsersError);
      console.error('Active users error stack:', activeUsersError.stack);
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
          ipAddress: clientIP, // Dynamic IP from request or server address
          connectionTime: connectionTime
        },
        threatsBlocked: {
          thisWeek: threatsThisWeek,
          percentageChange: percentageChange,
          totalBlockedIPs: uniqueBlockedIPs.length || 0,
          totalBlocklistIPs: totalBlocklistIPs, // Total IPs in blocklist (available to block)
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
        })),
        activeUsers: activeUsers
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

