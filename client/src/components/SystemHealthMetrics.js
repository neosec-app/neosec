import React, { useState, useEffect, useCallback } from 'react';
import { systemHealthAPI, getErrorMessage } from '../services/api';
import {
  FiServer,
  FiCpu,
  FiHardDrive,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiDatabase,
  FiRefreshCw
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const SystemHealthMetrics = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  const [healthMetrics, setHealthMetrics] = useState({
    overallHealth: 0,
    apiLatency: 0,
    cpuUsage: 0,
    ramUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    throughput: 0,
    errorRate: 0
  });
  const [apiPerformance, setApiPerformance] = useState([]);
  const [serverResources, setServerResources] = useState([]);
  const [vpnUptime, setVpnUptime] = useState([]);
  const [firewallSync, setFirewallSync] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('api');

  const fetchSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const [healthRes, apiRes, resourcesRes, vpnRes, firewallRes] = await Promise.all([
        systemHealthAPI.getSystemHealth(),
        systemHealthAPI.getAPIPerformance(timeRange),
        systemHealthAPI.getServerResources(timeRange),
        systemHealthAPI.getVPNUptime(),
        systemHealthAPI.getFirewallSyncData(7)
      ]);

      if (healthRes.success) {
        setHealthMetrics(healthRes.data);
      }
      if (apiRes.success) {
        setApiPerformance(apiRes.data || []);
      }
      if (resourcesRes.success) {
        setServerResources(resourcesRes.data || []);
      }
      if (vpnRes.success) {
        setVpnUptime(vpnRes.data || []);
      }
      if (firewallRes.success) {
        setFirewallSync(firewallRes.data || []);
      }
    } catch (err) {
      console.error('Fetch system health error:', err);
      setError(getErrorMessage(err, 'Failed to load system health metrics'));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchSystemHealth]);

  const getHealthStatus = (value) => {
    if (value >= 95) return { text: 'Excellent', color: isDark ? 'text-green-400' : 'text-green-600', icon: FiCheckCircle };
    if (value >= 85) return { text: 'Good', color: isDark ? 'text-blue-400' : 'text-blue-600', icon: FiCheckCircle };
    if (value >= 70) return { text: 'Fair', color: isDark ? 'text-yellow-400' : 'text-yellow-600', icon: FiAlertTriangle };
    return { text: 'Poor', color: isDark ? 'text-red-400' : 'text-red-600', icon: FiXCircle };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700';
      case 'degraded':
        return isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
      case 'offline':
        return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700';
      default:
        return isDark ? 'bg-gray-900/30 text-gray-400' : 'bg-gray-100 text-gray-700';
    }
  };

  const healthStatus = getHealthStatus(healthMetrics.overallHealth);
  const HealthIcon = healthStatus.icon;

  // Format data for charts
  const formatApiData = (data) => {
    if (!data || data.length === 0) {
      return [];
    }
    return data.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      response: item.responseTime ?? 0,
      requests: item.requestCount ?? 0
    }));
  };

  const formatResourceData = (data) => {
    if (!data || data.length === 0) {
      return [];
    }
    return data.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      cpu: item.cpuUsage ?? 0,
      ram: item.ramUsage ?? 0,
      disk: item.diskUsage ?? 0
    }));
  };

  const formatFirewallData = (data) => {
    if (!data || data.length === 0) {
      return [];
    }
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      success: item.successful ?? 0,
      failed: item.failed ?? 0
    }));
  };

  const formatVpnData = (data) => {
    if (!data || data.length === 0) {
      return [];
    }
    return data;
  };

  // Helper function to format values with N/A fallback
  const formatValue = (value, suffix = '') => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return `${value}${suffix}`;
  };

  // Calculate firewall success rate dynamically
  const calculateFirewallSuccessRate = () => {
    if (!firewallData || firewallData.length === 0) {
      return 'N/A';
    }
    const totalSuccess = firewallData.reduce((sum, item) => sum + (item.success || 0), 0);
    const totalFailed = firewallData.reduce((sum, item) => sum + (item.failed || 0), 0);
    const total = totalSuccess + totalFailed;
    if (total === 0) {
      return 'N/A';
    }
    return `${((totalSuccess / total) * 100).toFixed(1)}%`;
  };

  const apiData = formatApiData(apiPerformance);
  const resourceData = formatResourceData(serverResources);
  const firewallData = formatFirewallData(firewallSync);
  const vpnData = formatVpnData(vpnUptime);

  const chartColors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#1f2937' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className={`text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              System Health & Performance
            </h1>
            <button
              onClick={fetchSystemHealth}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time monitoring of server resources, API performance, and service uptime
          </p>
        </div>

        {loading ? (
          <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading system health metrics...
          </div>
        ) : error ? (
          <div className={`p-10 text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </div>
        ) : (
          <>
            {/* Overall Health Status */}
            <div className={`p-6 mb-8 rounded-lg border ${
              isDark 
                ? 'bg-gradient-to-br from-green-900/20 to-blue-900/20 border-gray-700' 
                : 'bg-gradient-to-br from-green-50 to-blue-50 border-gray-200'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <HealthIcon className={`w-12 h-12 ${healthStatus.color}`} />
                  </div>
                  <div>
                    <h2 className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Overall System Health</h2>
                    <div className="flex items-center gap-3">
                      <span className={`text-3xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatValue(healthMetrics.overallHealth, '%')}
                      </span>
                      {healthMetrics.overallHealth !== null && healthMetrics.overallHealth !== undefined && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor('online')}`}>
                          {healthStatus.text}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {healthMetrics.overallHealth !== null && healthMetrics.overallHealth !== undefined 
                        ? `All systems operational - Last updated: ${new Date().toLocaleTimeString()}`
                        : 'No data available'
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatValue(healthMetrics.activeConnections)}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Connections</div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatValue(healthMetrics.throughput, ' GB/s')}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Throughput</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <FiClock className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                </div>
                <div className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatValue(healthMetrics.apiLatency, 'ms')}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>API Response Time</div>
                {healthMetrics.apiLatency !== null && healthMetrics.apiLatency !== undefined && (
                  <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-blue-600"
                      style={{ width: `${Math.min(100, Math.max(0, 100 - (healthMetrics.apiLatency / 2)))}%` }}
                    />
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                    <FiCpu className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                </div>
                <div className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatValue(healthMetrics.cpuUsage, '%')}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>CPU Usage</div>
                {healthMetrics.cpuUsage !== null && healthMetrics.cpuUsage !== undefined && (
                  <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-purple-600"
                      style={{ width: `${Math.min(100, Math.max(0, healthMetrics.cpuUsage))}%` }}
                    />
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                    <FiDatabase className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                  </div>
                </div>
                <div className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatValue(healthMetrics.ramUsage, '%')}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>RAM Usage</div>
                {healthMetrics.ramUsage !== null && healthMetrics.ramUsage !== undefined && (
                  <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-orange-600"
                      style={{ width: `${Math.min(100, Math.max(0, healthMetrics.ramUsage))}%` }}
                    />
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                    <FiHardDrive className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                </div>
                <div className={`text-2xl mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatValue(healthMetrics.diskUsage, '%')}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Disk Usage</div>
                {healthMetrics.diskUsage !== null && healthMetrics.diskUsage !== undefined && (
                  <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-green-600"
                      style={{ width: `${Math.min(100, Math.max(0, healthMetrics.diskUsage))}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Metrics Tabs */}
            <div className="space-y-6">
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setActiveTab('api')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'api'
                      ? (isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900')
                      : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  API Performance
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'resources'
                      ? (isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900')
                      : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  Server Resources
                </button>
                <button
                  onClick={() => setActiveTab('vpn')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'vpn'
                      ? (isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900')
                      : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  VPN Uptime
                </button>
                <button
                  onClick={() => setActiveTab('firewall')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'firewall'
                      ? (isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900')
                      : (isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')
                  }`}
                >
                  Firewall Sync
                </button>
              </div>

              {/* API Performance Tab */}
              {activeTab === 'api' && (
                <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>API Response Times & Request Volume</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Average response time: {formatValue(healthMetrics.apiLatency, 'ms')} | Error rate: {formatValue(healthMetrics.errorRate, '%')}
                      </p>
                    </div>
                    {healthMetrics.apiLatency !== null && healthMetrics.apiLatency !== undefined && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor('online')}`}>
                        Operational
                      </span>
                    )}
                  </div>
                  {apiData.length === 0 ? (
                    <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No API performance data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={apiData}>
                      <defs>
                        <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.2} />
                      <XAxis dataKey="time" stroke={chartColors.text} />
                      <YAxis yAxisId="left" stroke="#22c55e" />
                      <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg, 
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          borderRadius: '8px',
                          color: isDark ? '#fff' : '#000'
                        }} 
                      />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="response" 
                        stroke="#22c55e" 
                        fillOpacity={1} 
                        fill="url(#colorResponse)"
                        name="Response Time (ms)"
                      />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorRequests)"
                        name="Requests"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* Server Resources Tab */}
              {activeTab === 'resources' && (
                <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Server Resource Utilization</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Real-time CPU, RAM, and disk usage monitoring
                      </p>
                    </div>
                  </div>
                  {resourceData.length === 0 ? (
                    <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No server resource data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={resourceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.2} />
                      <XAxis dataKey="time" stroke={chartColors.text} />
                      <YAxis stroke={chartColors.text} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg, 
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          borderRadius: '8px',
                          color: isDark ? '#fff' : '#000'
                        }} 
                      />
                      <Legend />
                      <Line type="monotone" dataKey="cpu" stroke="#a855f7" strokeWidth={2} name="CPU %" />
                      <Line type="monotone" dataKey="ram" stroke="#f97316" strokeWidth={2} name="RAM %" />
                      <Line type="monotone" dataKey="disk" stroke="#22c55e" strokeWidth={2} name="Disk %" />
                    </LineChart>
                  </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* VPN Uptime Tab */}
              {activeTab === 'vpn' && (
                <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="mb-6">
                    <h3 className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>VPN Server Uptime Monitoring</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Real-time status of all VPN servers worldwide
                    </p>
                  </div>
                  {vpnData.length === 0 ? (
                    <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No VPN server data available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {vpnData.map((server, index) => (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                            <FiServer className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>{server.server}</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(server.status)}`}>
                                {server.status}
                              </span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div 
                                className="h-full bg-green-600"
                                style={{ width: `${server.uptime}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{server.uptime}%</div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Uptime</div>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Firewall Sync Tab */}
              {activeTab === 'firewall' && (
                <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={`mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Firewall Rule Synchronization</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Success and failure rates for firewall rule deployments
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Success Rate</div>
                      <div className={`text-2xl ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {calculateFirewallSuccessRate()}
                      </div>
                    </div>
                  </div>
                  {firewallData.length === 0 ? (
                    <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No firewall sync data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={firewallData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.2} />
                      <XAxis dataKey="date" stroke={chartColors.text} />
                      <YAxis stroke={chartColors.text} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartColors.tooltipBg, 
                          border: `1px solid ${chartColors.tooltipBorder}`,
                          borderRadius: '8px',
                          color: isDark ? '#fff' : '#000'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="success" fill="#22c55e" name="Successful Syncs" />
                      <Bar dataKey="failed" fill="#ef4444" name="Failed Syncs" />
                    </BarChart>
                  </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>

            {/* System Alerts */}
            <div className={`p-6 mt-8 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent System Alerts</h3>
              <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No system alerts available
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SystemHealthMetrics;
