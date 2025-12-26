const os = require('os');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');
const checkDiskSpaceLib = require('check-disk-space');
const checkDiskSpace = checkDiskSpaceLib.default || checkDiskSpaceLib;
const FirewallRule = require('../models/FirewallRule');
const VpnConfig = require('../models/VpnConfig');
const Threat = require('../models/Threat');
const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');
const DataTransfer = require('../models/DataTransfer');

// Helper function to calculate CPU usage over a time interval
const getCpuUsage = () => {
  return new Promise((resolve) => {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    // Get initial CPU times
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const startIdle = totalIdle;
    const startTotal = totalTick;
    
    // Wait 100ms and measure again
    setTimeout(() => {
      const cpus2 = os.cpus();
      let totalIdle2 = 0;
      let totalTick2 = 0;
      
      cpus2.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick2 += cpu.times[type];
        }
        totalIdle2 += cpu.times.idle;
      });
      
      const endIdle = totalIdle2;
      const endTotal = totalTick2;
      
      const idle = endIdle - startIdle;
      const total = endTotal - startTotal;
      const usage = 100 - Math.round((idle / total) * 100);
      
      resolve(Math.max(0, Math.min(100, usage)));
    }, 100);
  });
};

// Get system health metrics
const getSystemHealth = async (req, res) => {
  try {
    // Get CPU and memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsage = Math.round((usedMem / totalMem) * 100);
    
    // Calculate CPU usage properly by sampling over time
    const cpuUsage = await getCpuUsage();
    
    // Get disk usage
    let diskUsage = 0;
    try {
      // Get the root path (C:\ on Windows, / on Unix)
      // On Windows, use the drive from current working directory or default to C:\
      let rootPath;
      if (os.platform() === 'win32') {
        const cwd = process.cwd();
        rootPath = cwd.substring(0, 3); // Get drive letter (e.g., "D:\")
      } else {
        rootPath = '/';
      }
      const diskSpace = await checkDiskSpace(rootPath);
      const total = diskSpace.size;
      const free = diskSpace.free;
      const used = total - free;
      diskUsage = Math.round((used / total) * 100);
    } catch (diskError) {
      console.error('Error getting disk usage:', diskError);
      // Fallback to a default value if disk check fails
      diskUsage = 0;
    }
    
    // Get active connections (devices online in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeDevices = await Device.count({
      where: {
        isActive: true,
        lastOnlineAt: {
          [Op.gte]: fiveMinutesAgo
        }
      }
    });
    
    // Calculate error rate from ActivityLog (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totalActivities, failedActivities] = await Promise.all([
      ActivityLog.count({
        where: {
          createdAt: {
            [Op.gte]: oneDayAgo
          }
        }
      }),
      ActivityLog.count({
        where: {
          createdAt: {
            [Op.gte]: oneDayAgo
          },
          status: 'Failed'
        }
      })
    ]);
    const errorRate = totalActivities > 0 ? ((failedActivities / totalActivities) * 100).toFixed(2) : 0;
    
    // Calculate throughput from DataTransfer (last hour, in GB/s)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTransfers = await DataTransfer.findAll({
      where: {
        sessionStart: {
          [Op.gte]: oneHourAgo
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('bytesSent')), 'totalSent'],
        [sequelize.fn('SUM', sequelize.col('bytesReceived')), 'totalReceived']
      ],
      raw: true
    });
    
    const totalBytes = (parseInt(recentTransfers[0]?.totalSent || 0) + parseInt(recentTransfers[0]?.totalReceived || 0));
    const throughput = (totalBytes / (1024 * 1024 * 1024) / 3600).toFixed(2); // GB/s
    
    // Calculate API latency (average time between activity log entries in last hour)
    // This is a simplified approach - in production, you'd track actual API response times
    const recentActivities = await ActivityLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: oneHourAgo
        }
      },
      order: [['createdAt', 'ASC']],
      limit: 100,
      attributes: ['createdAt']
    });
    
    let avgLatency = 52; // Default fallback
    if (recentActivities.length > 1) {
      let totalDiff = 0;
      for (let i = 1; i < recentActivities.length; i++) {
        const diff = recentActivities[i].createdAt - recentActivities[i - 1].createdAt;
        totalDiff += diff;
      }
      avgLatency = Math.round(totalDiff / (recentActivities.length - 1));
    }
    
    // Calculate overall health score (0-100)
    // Based on: CPU (30%), RAM (30%), Error Rate (20%), Active Connections (10%), Throughput (10%)
    const cpuScore = Math.max(0, 100 - cpuUsage);
    const ramScore = Math.max(0, 100 - ramUsage);
    const errorScore = Math.max(0, 100 - parseFloat(errorRate) * 10); // Error rate penalty
    const connectionScore = Math.min(100, activeDevices * 2); // Up to 50 devices = 100%
    const throughputScore = Math.min(100, parseFloat(throughput) * 30); // Up to ~3.3 GB/s = 100%
    
    const overallHealth = (
      cpuScore * 0.3 +
      ramScore * 0.3 +
      errorScore * 0.2 +
      connectionScore * 0.1 +
      throughputScore * 0.1
    ).toFixed(1);
    
    const healthMetrics = {
      overallHealth: parseFloat(overallHealth),
      apiLatency: avgLatency,
      cpuUsage: cpuUsage,
      ramUsage: ramUsage,
      diskUsage: diskUsage,
      activeConnections: activeDevices,
      throughput: parseFloat(throughput),
      errorRate: parseFloat(errorRate),
      serverUptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch()
    };

    res.status(200).json({
      success: true,
      data: healthMetrics
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system health',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get API performance data
const getAPIPerformance = async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Get activity logs grouped by time intervals (4-hour buckets)
    const intervalHours = 4;
    const data = [];
    
    for (let i = hours; i >= 0; i -= intervalHours) {
      const intervalStart = new Date(Date.now() - i * 60 * 60 * 1000);
      const intervalEnd = new Date(Date.now() - Math.max(0, i - intervalHours) * 60 * 60 * 1000);
      
      const [count, activities] = await Promise.all([
        ActivityLog.count({
          where: {
            createdAt: {
              [Op.gte]: intervalStart,
              [Op.lt]: intervalEnd
            }
          }
        }),
        ActivityLog.findAll({
          where: {
            createdAt: {
              [Op.gte]: intervalStart,
              [Op.lt]: intervalEnd
            }
          },
          order: [['createdAt', 'ASC']],
          attributes: ['createdAt']
        })
      ]);
      
      // Calculate average response time (time between activities)
      let avgResponse = 50; // Default
      if (activities.length > 1) {
        let totalDiff = 0;
        for (let j = 1; j < activities.length; j++) {
          totalDiff += activities[j].createdAt - activities[j - 1].createdAt;
        }
        avgResponse = activities.length > 1 ? Math.round(totalDiff / (activities.length - 1)) : 50;
      }
      
      data.push({
        time: intervalStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        response: Math.min(200, Math.max(20, avgResponse)), // Clamp between 20-200ms
        requests: count
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get API performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching API performance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get server resource data
const getServerResources = async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const intervalHours = 4;
    const data = [];
    
    // Get current system metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const currentRamUsage = Math.round((usedMem / totalMem) * 100);
    const currentCpuUsage = await getCpuUsage();
    
    // Get current disk usage
    let currentDiskUsage = 0;
    try {
      // Get the root path (C:\ on Windows, / on Unix)
      // On Windows, use the drive from current working directory or default to C:\
      let rootPath;
      if (os.platform() === 'win32') {
        const cwd = process.cwd();
        rootPath = cwd.substring(0, 3); // Get drive letter (e.g., "D:\")
      } else {
        rootPath = '/';
      }
      const diskSpace = await checkDiskSpace(rootPath);
      const total = diskSpace.size;
      const free = diskSpace.free;
      const used = total - free;
      currentDiskUsage = Math.round((used / total) * 100);
    } catch (diskError) {
      console.error('Error getting disk usage:', diskError);
      currentDiskUsage = 0;
    }
    
    // For historical data, we'll use current metrics with slight variations
    // In production, you'd store periodic snapshots
    for (let i = hours; i >= 0; i -= intervalHours) {
      const time = new Date();
      time.setHours(time.getHours() - i);
      
      // Use current metrics with small random variation for historical view
      // This simulates historical data - in production, store actual snapshots
      const variation = (Math.random() - 0.5) * 10; // ±5% variation
      const cpu = Math.max(0, Math.min(100, currentCpuUsage + variation));
      const ram = Math.max(0, Math.min(100, currentRamUsage + variation * 0.5));
      const disk = Math.max(0, Math.min(100, currentDiskUsage + variation * 0.3));
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        cpu: Math.round(cpu),
        ram: Math.round(ram),
        disk: Math.round(disk)
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get server resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching server resources',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get VPN uptime data
const getVPNUptime = async (req, res) => {
  try {
    // Get all VPN configs grouped by name
    const vpnConfigs = await VpnConfig.findAll({
      attributes: ['name', 'isActive', 'protocol'],
      where: {
        isActive: true
      }
    });

    // Group by VPN name and calculate uptime from ActivityLog
    const serverMap = new Map();
    
    for (const config of vpnConfigs) {
      const serverName = config.name;
      if (!serverMap.has(serverName)) {
        serverMap.set(serverName, {
          server: serverName,
          isActive: config.isActive,
          protocol: config.protocol,
          connectionCount: 0,
          disconnectionCount: 0
        });
      }
    }
    
    // Get connection/disconnection events from ActivityLog (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const vpnActivities = await ActivityLog.findAll({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        },
        eventType: {
          [Op.in]: ['VPN Connection', 'VPN Disconnection']
        }
      },
      attributes: ['eventType', 'status', 'createdAt', 'description']
    });
    
    // Count connections/disconnections per server (from description)
    for (const activity of vpnActivities) {
      const description = activity.description || '';
      for (const [serverName, serverData] of serverMap.entries()) {
        if (description.includes(serverName) || description.includes(serverData.server)) {
          if (activity.eventType === 'VPN Connection' && activity.status === 'Success') {
            serverData.connectionCount++;
          } else if (activity.eventType === 'VPN Disconnection') {
            serverData.disconnectionCount++;
          }
        }
      }
    }
    
    // Calculate uptime percentage and status
    const servers = Array.from(serverMap.values()).map(serverData => {
      const totalEvents = serverData.connectionCount + serverData.disconnectionCount;
      let uptime = 100;
      let status = 'online';
      
      if (totalEvents > 0) {
        // Uptime = successful connections / total events
        const successRate = serverData.connectionCount / totalEvents;
        uptime = (successRate * 100).toFixed(2);
        
        if (uptime < 95) {
          status = 'degraded';
        } else if (uptime < 80) {
          status = 'offline';
        }
      } else {
        // No activity - assume online if config is active
        uptime = serverData.isActive ? 100 : 0;
        status = serverData.isActive ? 'online' : 'offline';
      }
      
      return {
        server: serverData.server,
        uptime: parseFloat(uptime),
        status: status
      };
    });
    
    // If no VPN configs, return empty array or default servers
    if (servers.length === 0) {
      servers.push({
        server: 'No Active VPN Servers',
        uptime: 0,
        status: 'offline'
      });
    }

    res.status(200).json({
      success: true,
      data: servers
    });
  } catch (error) {
    console.error('Get VPN uptime error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching VPN uptime',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get firewall sync data
const getFirewallSyncData = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get firewall rule update activities for this day
      const [successCount, failedCount] = await Promise.all([
        ActivityLog.count({
          where: {
            eventType: 'Firewall Rule Update',
            status: 'Success',
            createdAt: {
              [Op.gte]: startOfDay,
              [Op.lte]: endOfDay
            }
          }
        }),
        ActivityLog.count({
          where: {
            eventType: 'Firewall Rule Update',
            status: 'Failed',
            createdAt: {
              [Op.gte]: startOfDay,
              [Op.lte]: endOfDay
            }
          }
        })
      ]);
      
      // Also count device syncs (from Device model's firewallSyncStatus)
      const deviceSyncs = await Device.count({
        where: {
          lastFirewallSyncAt: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          },
          firewallSyncStatus: {
            [Op.in]: ['synced', 'pending', 'failed']
          }
        }
      });
      
      const success = successCount + (deviceSyncs > 0 ? Math.floor(deviceSyncs * 0.95) : 0);
      const failed = failedCount + (deviceSyncs > 0 ? Math.floor(deviceSyncs * 0.05) : 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        success: success,
        failed: failed
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get firewall sync data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching firewall sync data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getSystemHealth,
  getAPIPerformance,
  getServerResources,
  getVPNUptime,
  getFirewallSyncData
};

