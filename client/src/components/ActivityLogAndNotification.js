import React, { useState, useEffect } from 'react';
import { notificationAPI, activityLogAPI, getErrorMessage } from '../services/api';
import { 
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiAlertTriangle,
  FiActivity,
  FiShield,
  FiBell,
  FiClock,
  FiInfo,
  FiCalendar
} from 'react-icons/fi';

const ActivityLogAndNotification = ({ theme = 'dark', palette }) => {
  const isDark = theme === 'dark';

  // Tab state
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'activity'

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]); // Store all notifications for unread count
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationTab, setNotificationTab] = useState('all');

  // Activity Logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityDateRange, setActivityDateRange] = useState('7days');
  const [activityEventTypeFilter, setActivityEventTypeFilter] = useState('all');
  const [activitySeverityFilter, setActivitySeverityFilter] = useState('all');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityPagination, setActivityPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Load notifications for unread count (all notifications)
  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getNotifications({});
      if (response.success) {
        // Store all notifications for unread count calculation
        setAllNotifications(response.data || []);
      }
    } catch (err) {
      console.error('Load unread count error:', err);
      // Don't show error for background unread count fetch
    }
  };

  // Load notifications (with filters when on notifications tab)
  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const params = {};
      if (notificationTab === 'unread') {
        params.status = 'unread';
      } else if (notificationTab === 'critical') {
        params.priority = 'critical';
      } else if (notificationTab === 'system') {
        params.eventType = 'system_error';
      }

      const response = await notificationAPI.getNotifications(params);
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (err) {
      console.error('Load notifications error:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Load activity logs
  const loadActivityLogs = async () => {
    try {
      setActivityLogsLoading(true);
      const params = {
        page: activityPagination.page,
        limit: activityPagination.limit,
        eventType: activityEventTypeFilter !== 'all' ? activityEventTypeFilter : undefined,
        severity: activitySeverityFilter !== 'all' ? activitySeverityFilter : undefined,
        search: activitySearchQuery || undefined,
      };

      // Add date range
      if (activityDateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
      } else if (activityDateRange === '7days') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
      } else if (activityDateRange === '30days') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        params.startDate = monthAgo.toISOString();
      }

      const response = await activityLogAPI.getLogs(params);
      if (response.success) {
        setActivityLogs(response.data.logs || []);
        if (response.data.pagination) {
          setActivityPagination(response.data.pagination);
        }
      }
    } catch (err) {
      console.error('Load activity logs error:', err);
    } finally {
      setActivityLogsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update both filtered notifications and all notifications
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, status: 'read' } : n
      ));
      setAllNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, status: 'read' } : n
      ));
      // Reload to ensure sync
      loadNotifications();
      loadUnreadCount();
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      // Update both filtered notifications and all notifications
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      setAllNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      // Reload to ensure sync
      loadNotifications();
      loadUnreadCount();
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  };

  const getNotificationIcon = (eventType) => {
    if (eventType && eventType.includes('threat')) {
      return <FiShield size={20} style={{ color: '#e04848' }} />;
    } else if (eventType && (eventType.includes('vpn') || eventType.includes('VPN'))) {
      return <FiActivity size={20} style={{ color: '#36E27B' }} />;
    } else if (eventType && eventType.includes('system')) {
      return <FiAlertTriangle size={20} style={{ color: '#f0a500' }} />;
    }
    return <FiInfo size={20} style={{ color: '#4a90e2' }} />;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return { color: '#e04848', bg: isDark ? 'rgba(224, 72, 72, 0.2)' : '#fee2e2' };
      case 'warning':
        return { color: '#f0a500', bg: isDark ? 'rgba(240, 165, 0, 0.2)' : '#fef3c7' };
      case 'info':
      default:
        return { color: '#4a90e2', bg: isDark ? 'rgba(74, 144, 226, 0.2)' : '#dbeafe' };
    }
  };

  // Load unread count on component mount and periodically
  useEffect(() => {
    // Load all notifications to get unread count on mount
    loadUnreadCount();
    
    // Set up periodic refresh for unread count (every 30 seconds)
    const unreadCountInterval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    
    return () => clearInterval(unreadCountInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
    } else if (activeTab === 'activity') {
      loadActivityLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Auto-refresh notifications
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, notificationTab]);

  // Auto-refresh activity logs
  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivityLogs();
      const interval = setInterval(loadActivityLogs, 60000); // Refresh every 60 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activityDateRange, activityEventTypeFilter, activitySeverityFilter, activitySearchQuery, activityPagination.page]);

  // Notification filtering - use allNotifications for unread count
  const unreadCount = allNotifications.filter(n => n.status === 'unread').length;
  const filteredNotifications = notifications.filter(notif => {
    if (notificationTab === 'all') return true;
    if (notificationTab === 'unread') return notif.status === 'unread';
    if (notificationTab === 'critical') return notif.priority === 'critical';
    if (notificationTab === 'system') return notif.eventType && notif.eventType.includes('system');
    return true;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Activity Log and Notification
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeTab === 'notifications'
                ? 'Manage your security alerts and system notifications'
                : 'View your activity logs and system events'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'notifications'
                ? `${isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900'}`
                : `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
            }`}
            style={activeTab === 'notifications' ? { borderBottomColor: isDark ? '#fff' : '#111827' } : {}}
          >
            <div className="flex items-center gap-2">
              <FiBell size={16} />
              Notifications
              {unreadCount > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                }`}>
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'activity'
                ? `${isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900'}`
                : `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
            }`}
            style={activeTab === 'activity' ? { borderBottomColor: isDark ? '#fff' : '#111827' } : {}}
          >
            <div className="flex items-center gap-2">
              <FiActivity size={16} />
              Activity Log
            </div>
          </button>
        </div>

        {/* Notifications View */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Notifications
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your security alerts and system notifications
                </p>
              </div>
              <button
                onClick={handleMarkAllAsRead}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Mark All as Read
              </button>
            </div>

            {/* Notification Tabs */}
            <div className="flex gap-2 mb-6 border-b" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
              <button
                onClick={() => setNotificationTab('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  notificationTab === 'all'
                    ? `${isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900'}`
                    : `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                }`}
                style={notificationTab === 'all' ? { borderBottomColor: isDark ? '#fff' : '#111827' } : {}}
              >
                All
              </button>
              <button
                onClick={() => setNotificationTab('unread')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  notificationTab === 'unread'
                    ? `${isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900'}`
                    : `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                }`}
                style={notificationTab === 'unread' ? { borderBottomColor: isDark ? '#fff' : '#111827' } : {}}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
              <button
                onClick={() => setNotificationTab('critical')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  notificationTab === 'critical'
                    ? `${isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900'}`
                    : `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                }`}
                style={notificationTab === 'critical' ? { borderBottomColor: isDark ? '#fff' : '#111827' } : {}}
              >
                Critical
              </button>
              <button
                onClick={() => setNotificationTab('system')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  notificationTab === 'system'
                    ? `${isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900'}`
                    : `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                }`}
                style={notificationTab === 'system' ? { borderBottomColor: isDark ? '#fff' : '#111827' } : {}}
              >
                System
              </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {notificationsLoading ? (
                <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading notifications...
                </div>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const severityStyle = getSeverityColor(notification.severity || notification.priority);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        notification.status === 'unread'
                          ? (isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200')
                          : (isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {notification.status === 'unread' && (
                                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}></span>
                              )}
                              <span
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{
                                  color: severityStyle.color,
                                  backgroundColor: severityStyle.bg
                                }}
                              >
                                {notification.severity || notification.priority}
                              </span>
                            </div>
                          </div>
                          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <FiClock size={12} />
                              {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                            </span>
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className={`text-xs px-3 py-1 rounded transition-colors ${
                                isDark
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                            >
                              Mark as Read
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No notifications found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Log View */}
        {activeTab === 'activity' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Activity Logs
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  View your activity logs and system events
                </p>
              </div>
              <button
                onClick={loadActivityLogs}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Filters */}
            <div className={`p-4 mb-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <FiCalendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <select
                    value={activityDateRange}
                    onChange={(e) => setActivityDateRange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="today">Today</option>
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                  </select>
                </div>

                <div className="relative">
                  <FiFilter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <select
                    value={activityEventTypeFilter}
                    onChange={(e) => setActivityEventTypeFilter(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="all">All Event Types</option>
                    <option value="VPN Connection">VPN Connection</option>
                    <option value="VPN Disconnection">VPN Disconnection</option>
                    <option value="Blocked Threat">Blocked Threat</option>
                    <option value="Firewall Rule Update">Firewall Rule Update</option>
                    <option value="Profile Activation">Profile Activation</option>
                    <option value="Profile Deactivation">Profile Deactivation</option>
                    <option value="Blocklist Update">Blocklist Update</option>
                    <option value="System Event">System Event</option>
                  </select>
                </div>

                <div className="relative">
                  <FiAlertTriangle className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <select
                    value={activitySeverityFilter}
                    onChange={(e) => setActivitySeverityFilter(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>

                <div className="relative">
                  <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Activity Logs Table */}
            <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {activityLogsLoading ? (
                <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading activity logs...
                </div>
              ) : activityLogs.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Timestamp</th>
                          <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Event Type</th>
                          <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</th>
                          <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>IP Address</th>
                          <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                          <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs.map((log) => {
                          const severityStyle = getSeverityColor(log.severity);
                          return (
                            <tr
                              key={log.id}
                              className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-900/30' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                              <td className={`px-3 py-3 font-mono text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                  isDark ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'
                                }`}>
                                  {log.eventType}
                                </span>
                              </td>
                              <td className={`px-3 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {log.description}
                              </td>
                              <td className={`px-3 py-3 font-mono text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {log.ipAddress || '-'}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                                  log.status === 'Success' || log.status === 'Blocked'
                                    ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                                    : (isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium"
                                  style={{
                                    color: severityStyle.color,
                                    backgroundColor: severityStyle.bg
                                  }}
                                >
                                  {log.severity}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {activityPagination && activityPagination.totalPages > 1 && (
                    <div className={`flex items-center justify-between p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Showing {activityLogs.length} of {activityPagination.total} entries
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActivityPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={activityPagination.page === 1}
                          className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                            activityPagination.page === 1
                              ? (isDark ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed')
                              : (isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setActivityPagination(prev => ({ ...prev, page: Math.min(prev.totalPages || 1, prev.page + 1) }))}
                          disabled={activityPagination.page >= activityPagination.totalPages}
                          className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                            activityPagination.page >= activityPagination.totalPages
                              ? (isDark ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed')
                              : (isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No activity logs found matching your filters
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ActivityLogAndNotification;

