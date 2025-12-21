import React, { useState, useEffect, useCallback } from 'react';
import { auditAPI, notificationAPI, activityLogAPI, getErrorMessage } from '../services/api';
import { 
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiUserPlus,
  FiUserMinus,
  FiEdit,
  FiLock,
  FiUnlock,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiActivity,
  FiShield,
  FiBell,
  FiClock,
  FiInfo
} from 'react-icons/fi';

const AdminAuditTrail = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  // Tab state
  const [activeTab, setActiveTab] = useState('audit'); // 'audit', 'notifications', or 'activity'

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7days');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [stats, setStats] = useState({
    totalActions: 0,
    successRate: 0,
    activeAdmins: 0,
    criticalActions: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationTab, setNotificationTab] = useState('all');

  // Activity Logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityDateRange, setActivityDateRange] = useState('7days');
  const [activityUserRoleFilter, setActivityUserRoleFilter] = useState('all');
  const [activityEventTypeFilter, setActivityEventTypeFilter] = useState('all');
  const [activitySeverityFilter, setActivitySeverityFilter] = useState('all');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityPagination, setActivityPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await auditAPI.getAuditLogs({
        dateRange,
        category: categoryFilter,
        adminUserId: adminFilter,
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setAuditLogs(response.data || []);
        if (response.stats) {
          setStats(response.stats);
        }
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.message || 'Failed to load audit logs');
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setError(getErrorMessage(err, 'Failed to load audit logs'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, categoryFilter, adminFilter, searchQuery, pagination.page, pagination.limit]);

  // Load notifications
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
      setError(getErrorMessage(err, 'Failed to load notifications'));
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
        userRole: activityUserRoleFilter !== 'all' ? activityUserRoleFilter : undefined,
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
      setError(getErrorMessage(err, 'Failed to load activity logs'));
    } finally {
      setActivityLogsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      loadNotifications();
    } catch (err) {
      console.error('Mark as read error:', err);
      setError(getErrorMessage(err, 'Failed to mark notification as read'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      loadNotifications();
    } catch (err) {
      console.error('Mark all as read error:', err);
      setError(getErrorMessage(err, 'Failed to mark all notifications as read'));
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

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'notifications') {
      loadNotifications();
    } else if (activeTab === 'activity') {
      loadActivityLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAuditLogs, activeTab]);

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
  }, [activeTab, activityDateRange, activityUserRoleFilter, activityEventTypeFilter, activitySeverityFilter, activitySearchQuery, activityPagination.page]);

  const getActionIcon = (action) => {
    if (action?.includes('Created') || action?.includes('Import')) return <FiUserPlus className="w-4 h-4" />;
    if (action?.includes('Deleted')) return <FiUserMinus className="w-4 h-4" />;
    if (action?.includes('Edit') || action?.includes('Updated') || action?.includes('Changed')) return <FiEdit className="w-4 h-4" />;
    if (action?.includes('Locked')) return <FiLock className="w-4 h-4" />;
    if (action?.includes('Unlocked')) return <FiUnlock className="w-4 h-4" />;
    return <FiActivity className="w-4 h-4" />;
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      'User Management': isDark ? 'border-blue-800 text-blue-400' : 'border-blue-200 text-blue-700',
      'Firewall': isDark ? 'border-purple-800 text-purple-400' : 'border-purple-200 text-purple-700',
      'Security': isDark ? 'border-red-800 text-red-400' : 'border-red-200 text-red-700',
      'Settings': isDark ? 'border-orange-800 text-orange-400' : 'border-orange-200 text-orange-700',
    };
    return colorMap[category] || (isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-700');
  };

  const handleSelectEntry = (entryId) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleExport = async () => {
    try {
      const response = await auditAPI.exportAuditLogs({
        format: exportFormat,
        dateRange,
        entryIds: selectedEntries.length > 0 ? selectedEntries : null
      });
      
      // Create blob and download
      const blob = new Blob([response], { type: exportFormat === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setShowExportDialog(false);
      setSelectedEntries([]);
    } catch (err) {
      console.error('Export error:', err);
      setError(getErrorMessage(err, 'Failed to export audit logs'));
    }
  };

  const filteredLogs = auditLogs.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.action?.toLowerCase().includes(query) ||
      entry.details?.toLowerCase().includes(query) ||
      entry.adminUser?.email?.toLowerCase().includes(query)
    );
  });

  const successCount = auditLogs.filter(e => e.result === 'success').length;
  const successRate = auditLogs.length > 0 ? ((successCount / auditLogs.length) * 100).toFixed(1) : 0;
  const uniqueAdmins = new Set(auditLogs.map(e => e.adminUser?.email).filter(Boolean)).size;
  const securityActions = auditLogs.filter(e => e.category === 'Security').length;

  // Notification filtering
  const unreadCount = notifications.filter(n => n.status === 'unread').length;
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
              Admin Activity Audit Trail
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {activeTab === 'audit' 
                ? 'Complete log of all administrative actions and system changes'
                : activeTab === 'notifications'
                ? 'Manage your security alerts and system notifications'
                : 'System-wide activity logs and user events'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportDialog(true)}
              disabled={selectedEntries.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selectedEntries.length === 0
                  ? `${isDark ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'}`
                  : `${isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`
              }`}
            >
              <FiDownload className="w-4 h-4" />
              Export Selected
            </button>
            <button
              onClick={() => setShowExportDialog(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiDownload className="w-4 h-4" />
              Export All
            </button>
            <button
              onClick={fetchAuditLogs}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'audit'
                ? `${isDark ? 'text-white border-b-2 border-white' : 'text-gray-900 border-b-2 border-gray-900'}`
                : `${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
            }`}
            style={activeTab === 'audit' ? { borderBottomColor: isDark ? '#fff' : '#111827' } : {}}
          >
            <div className="flex items-center gap-2">
              <FiFileText size={16} />
              Audit Logs
            </div>
          </button>
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

        {/* Statistics Cards - Only show for audit tab */}
        {activeTab === 'audit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Actions</span>
              <FiActivity className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalActions || auditLogs.length}</div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Last 7 days</p>
          </div>

          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Success Rate</span>
              <FiCheckCircle className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{successRate}%</div>
            <p className={`text-xs mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>Excellent performance</p>
          </div>

          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Admins</span>
              <FiUsers className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.activeAdmins || uniqueAdmins}</div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This period</p>
          </div>

          <div className={`p-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Security Actions</span>
              <FiAlertTriangle className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.criticalActions || securityActions}</div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Critical events</p>
          </div>
        </div>
        )}

        {/* Filters - Only show for audit tab */}
        {activeTab === 'audit' && (
        <div className={`p-4 mb-6 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <FiCalendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="relative">
              <FiFilter className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="all">All Categories</option>
                <option value="User Management">User Management</option>
                <option value="Firewall">Firewall</option>
                <option value="Security">Security</option>
                <option value="Settings">Settings</option>
              </select>
            </div>

            <div className="relative">
              <FiUsers className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <select
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="all">All Admins</option>
                {/* Admin list would be populated from API */}
              </select>
            </div>

            <div className="relative">
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
                }`}
              />
            </div>
          </div>
        </div>
        )}

        {/* Audit Logs View */}
        {activeTab === 'audit' && (
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {loading ? (
            <div className={`p-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading audit logs...
            </div>
          ) : error ? (
            <div className={`p-10 text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                    <tr>
                      <th className="w-12 px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedEntries.length === filteredLogs.length && filteredLogs.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntries(filteredLogs.map(log => log.id));
                            } else {
                              setSelectedEntries([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Timestamp</th>
                      <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Admin User</th>
                      <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Action</th>
                      <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Target User</th>
                      <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Details</th>
                      <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</th>
                      <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>IP Address</th>
                      <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((entry) => (
                        <tr
                          key={entry.id}
                          className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-900/30' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedEntries.includes(entry.id)}
                              onChange={() => handleSelectEntry(entry.id)}
                              className="rounded"
                            />
                          </td>
                          <td className={`px-3 py-3 font-mono text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(entry.createdAt).toLocaleString()}
                          </td>
                          <td className={`px-3 py-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {entry.adminUser?.email || 'N/A'}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {getActionIcon(entry.action)}
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>{entry.action}</span>
                            </div>
                          </td>
                          <td className={`px-3 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {entry.targetUser?.email || '-'}
                          </td>
                          <td className={`px-3 py-3 max-w-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {entry.details}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(entry.category)}`}>
                              {entry.category}
                            </span>
                          </td>
                          <td className={`px-3 py-3 font-mono text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {entry.ipAddress || 'N/A'}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                              entry.result === 'success'
                                ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                                : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')
                            }`}>
                              {entry.result === 'success' ? (
                                <FiCheckCircle className="w-3 h-3" />
                              ) : (
                                <FiAlertTriangle className="w-3 h-3" />
                              )}
                              {entry.result}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className={`px-3 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No audit entries found matching your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`flex items-center justify-between p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {filteredLogs.length} of {pagination.total || auditLogs.length} entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                      pagination.page === 1
                        ? (isDark ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed')
                        : (isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages || 1, prev.page + 1) }))}
                    disabled={pagination.page >= (pagination.pages || 1)}
                    className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                      pagination.page >= (pagination.pages || 1)
                        ? (isDark ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed')
                        : (isDark ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        )}

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
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  isDark
                                    ? `text-[${severityStyle.color}] bg-[${severityStyle.bg}]`
                                    : `text-[${severityStyle.color}] bg-[${severityStyle.bg}]`
                                }`}
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
                  System-wide activity logs and user events
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
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
                  <FiUsers className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <select
                    value={activityUserRoleFilter}
                    onChange={(e) => setActivityUserRoleFilter(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="all">All Users</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
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
                          <th className={`px-3 py-3 text-left text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>User</th>
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
                              <td className={`px-3 py-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {log.user?.email || 'System'}
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

      {/* Export Dialog */}
      {showExportDialog && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExportDialog(false);
          }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-lg border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Export Audit Trail
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Export audit logs for compliance and reporting purposes
            </p>

            <div className="space-y-4">
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="today">Today</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              <div>
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="csv">CSV (Excel Compatible)</option>
                  <option value="pdf">PDF Report</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <div className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FiFileText className="w-4 h-4" />
                  {selectedEntries.length > 0
                    ? `Exporting ${selectedEntries.length} selected entries`
                    : `Exporting all ${filteredLogs.length} entries`
                  }
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowExportDialog(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isDark ? 'bg-transparent border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                Export Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditTrail;
