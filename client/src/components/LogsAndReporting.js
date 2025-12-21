import React, { useState, useEffect } from 'react';
import { activityLogAPI, notificationAPI, getErrorMessage } from '../services/api';
import { FiShield, FiSearch, FiDownload, FiRefreshCw, FiSettings, FiAlertTriangle, FiCheckCircle, FiXCircle, FiInfo, FiEye, FiX, FiClock, FiActivity, FiDatabase } from 'react-icons/fi';
import './LogsAndReporting.css';

const LogsAndReporting = ({ theme = 'dark', palette }) => {
  const darkPalette = {
    bgMain: '#121212',
    bgCard: '#181818',
    text: '#ffffff',
    textMuted: '#9aa3b5',
    border: '#242424',
    accent: '#36E27B',
    warning: '#f0a500',
    danger: '#e04848',
    info: '#4a90e2',
    inputBg: '#1c1c1c',
    inputBorder: '#2c2c2c',
  };

  const lightPalette = {
    bgMain: '#f6f8fb',
    bgCard: '#ffffff',
    text: '#0b172a',
    textMuted: '#5b6b7a',
    border: '#d9e2ec',
    accent: '#1fa45a',
    warning: '#d97706',
    danger: '#d4183d',
    info: '#4a90e2',
    inputBg: '#ffffff',
    inputBorder: '#d9e2ec',
  };

  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [currentView, setCurrentView] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');

  // Filters for logs
  const [dateRange, setDateRange] = useState('7days');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Notification tab
  const [notificationTab, setNotificationTab] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    if (currentView === 'logs') {
      loadLogs();
    } else if (currentView === 'notifications') {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, page, dateRange, eventTypeFilter, severityFilter, searchQuery]);

  useEffect(() => {
    if (currentView === 'notifications') {
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 50,
        eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        search: searchQuery || undefined,
      };

      // Add date range
      if (dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
      } else if (dateRange === '7days') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
      } else if (dateRange === '30days') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        params.startDate = monthAgo.toISOString();
      }

      const response = await activityLogAPI.getLogs(params);
      if (response.success) {
        setLogs(response.data.logs || []);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const params = {};
      if (notificationTab === 'unread') {
        params.status = 'unread';
      } else if (notificationTab === 'critical') {
        params.priority = 'critical';
      } else if (notificationTab === 'system') {
        // Filter system notifications by eventType
        params.eventType = 'system_error';
      }

      const response = await notificationAPI.getNotifications(params);
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleViewLog = async (logId) => {
    try {
      const response = await activityLogAPI.getLogById(logId);
      if (response.success) {
        setSelectedLog(response.data);
        setShowLogDetail(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        format: exportFormat,
      };

      const blob = await activityLogAPI.exportLogs(params, exportFormat);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportDialog(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to export logs'));
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      loadNotifications();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      loadNotifications();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return { color: colors.danger, bg: theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)' };
      case 'warning':
        return { color: colors.warning, bg: theme === 'light' ? '#fef3c7' : 'rgba(240, 165, 0, 0.2)' };
      case 'info':
        return { color: colors.info, bg: theme === 'light' ? '#dbeafe' : 'rgba(74, 144, 226, 0.2)' };
      default:
        return { color: colors.textMuted, bg: 'transparent' };
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <FiXCircle size={16} />;
      case 'warning':
        return <FiAlertTriangle size={16} />;
      case 'info':
        return <FiInfo size={16} />;
      default:
        return <FiCheckCircle size={16} />;
    }
  };

  const getNotificationIcon = (eventType) => {
    if (eventType && eventType.includes('threat')) {
      return <FiShield size={20} style={{ color: colors.danger }} />;
    } else if (eventType && (eventType.includes('vpn') || eventType.includes('VPN'))) {
      return <FiActivity size={20} style={{ color: colors.info }} />;
    }
    return <FiSettings size={20} style={{ color: colors.textMuted }} />;
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const filteredNotifications = notifications.filter(notif => {
    if (notificationTab === 'all') return true;
    if (notificationTab === 'unread') return notif.status === 'unread';
    if (notificationTab === 'critical') return notif.priority === 'critical';
    if (notificationTab === 'system') return notif.eventType && notif.eventType.includes('system');
    return true;
  });

  return (
    <div className="logs-container" style={{ backgroundColor: colors.bgMain, color: colors.text, minHeight: '100vh' }}>
      <div className="logs-content">
        {/* Sub Navigation */}
        <div className="logs-nav" style={{ borderBottomColor: colors.border }}>
          <button
            className={`nav-tab ${currentView === 'logs' ? 'active' : ''}`}
            onClick={() => setCurrentView('logs')}
            style={{
              borderBottomColor: currentView === 'logs' ? colors.accent : 'transparent',
              color: currentView === 'logs' ? colors.accent : colors.textMuted
            }}
          >
            Activity Logs
          </button>
          <button
            className={`nav-tab ${currentView === 'notifications' ? 'active' : ''}`}
            onClick={() => setCurrentView('notifications')}
            style={{
              borderBottomColor: currentView === 'notifications' ? colors.accent : 'transparent',
              color: currentView === 'notifications' ? colors.accent : colors.textMuted
            }}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="unread-badge" style={{ backgroundColor: colors.danger }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Logs View */}
        {currentView === 'logs' && (
          <div className="logs-view">
            <div className="view-header">
              <div>
                <h1 className="view-title">Activity Logs</h1>
                <p className="view-description" style={{ color: colors.textMuted }}>
                  View and manage all system activity and security events
                </p>
              </div>
              <div className="header-actions">
                <button
                  className="btn-action"
                  onClick={() => setShowExportDialog(true)}
                  style={{
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <FiDownload size={16} /> Export Selected
                </button>
                <button
                  className="btn-action"
                  onClick={() => setShowExportDialog(true)}
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  <FiDownload size={16} /> Export All
                </button>
                <button
                  className="btn-action"
                  onClick={loadLogs}
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  <FiRefreshCw size={16} /> Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="filters-card card" style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.border
            }}>
              <div className="filters-grid">
                <select
                  className="filter-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text
                  }}
                >
                  <option value="today">Today</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="custom">Custom</option>
                </select>

                <select
                  className="filter-select"
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text
                  }}
                >
                  <option value="all">All Events</option>
                  <option value="VPN Connection">VPN Connections</option>
                  <option value="Blocked Threat">Blocked Threats</option>
                  <option value="Notification">Notifications</option>
                  <option value="System Event">System Events</option>
                </select>

                <select
                  className="filter-select"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text
                  }}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>

                <div className="search-box">
                  <FiSearch size={16} className="search-icon" style={{ color: colors.textMuted }} />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                    style={{
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.text
                    }}
                  />
                </div>
              </div>

              {(eventTypeFilter !== 'all' || severityFilter !== 'all' || searchQuery) && (
                <div className="clear-filters">
                  <button
                    className="btn-clear"
                    onClick={() => {
                      setEventTypeFilter('all');
                      setSeverityFilter('all');
                      setSearchQuery('');
                    }}
                    style={{ color: colors.textMuted }}
                  >
                    <FiX size={16} /> Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Logs Table */}
            <div className="logs-table-card card" style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.border
            }}>
              <div className="table-wrapper">
                <table className="logs-table">
                  <thead>
                    <tr style={{ borderBottomColor: colors.border }}>
                      <th>Timestamp</th>
                      <th>Event Type</th>
                      <th>User</th>
                      <th>Description</th>
                      <th>IP Address</th>
                      <th>Status</th>
                      <th>Severity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="loading-cell" style={{ color: colors.textMuted }}>
                          Loading logs...
                        </td>
                      </tr>
                    ) : logs.length > 0 ? (
                      logs.map((log) => {
                        const severityStyle = getSeverityColor(log.severity);
                        return (
                          <tr key={log.id} style={{ borderBottomColor: colors.border }}>
                            <td className="timestamp-cell" style={{ color: colors.textMuted }}>
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}
                            </td>
                            <td>
                              <span className="event-badge" style={{
                                borderColor: colors.border
                              }}>
                                {log.eventType}
                              </span>
                            </td>
                            <td className="user-cell" style={{ color: colors.textMuted }}>
                              {log.user?.email || 'System'}
                            </td>
                            <td className="description-cell">{log.description}</td>
                            <td className="ip-cell" style={{ color: colors.textMuted }}>
                              {log.ipAddress || '-'}
                            </td>
                            <td>
                              <span className="status-badge" style={{
                                backgroundColor: log.status === 'Success' || log.status === 'Blocked'
                                  ? (theme === 'light' ? '#e6f4ed' : 'rgba(54,226,123,0.2)')
                                  : (theme === 'light' ? '#fef3c7' : 'rgba(240,165,0,0.2)'),
                                color: log.status === 'Success' || log.status === 'Blocked'
                                  ? colors.accent
                                  : colors.warning
                              }}>
                                {log.status}
                              </span>
                            </td>
                            <td>
                              <span className="severity-badge" style={{
                                color: severityStyle.color,
                                backgroundColor: severityStyle.bg
                              }}>
                                {getSeverityIcon(log.severity)}
                                <span style={{ marginLeft: '4px' }}>{log.severity}</span>
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-view"
                                onClick={() => handleViewLog(log.id)}
                                style={{ color: colors.accent }}
                              >
                                <FiEye size={16} /> View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="empty-cell" style={{ color: colors.textMuted }}>
                          No logs found matching your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="table-pagination">
                  <div className="pagination-info" style={{ color: colors.textMuted }}>
                    Showing {logs.length} of {pagination.total} entries
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        borderColor: colors.border,
                        color: page === 1 ? colors.textMuted : colors.text
                      }}
                    >
                      Previous
                    </button>
                    <button
                      className="pagination-btn"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= pagination.totalPages}
                      style={{
                        borderColor: colors.border,
                        color: page >= pagination.totalPages ? colors.textMuted : colors.text
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications View - simplified for now, full implementation would go here */}
        {currentView === 'notifications' && (
          <div className="notifications-view">
            <div className="view-header">
              <div>
                <h1 className="view-title">Notifications</h1>
                <p className="view-description" style={{ color: colors.textMuted }}>
                  Manage your security alerts and system notifications
                </p>
              </div>
              <div className="header-actions">
                <button
                  className="btn-action"
                  onClick={handleMarkAllAsRead}
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  Mark All as Read
                </button>
              </div>
            </div>

            <div className="notification-tabs">
              <button
                className={`tab-btn ${notificationTab === 'all' ? 'active' : ''}`}
                onClick={() => setNotificationTab('all')}
                style={{
                  borderBottomColor: notificationTab === 'all' ? colors.accent : 'transparent',
                  color: notificationTab === 'all' ? colors.accent : colors.textMuted
                }}
              >
                All
              </button>
              <button
                className={`tab-btn ${notificationTab === 'unread' ? 'active' : ''}`}
                onClick={() => setNotificationTab('unread')}
                style={{
                  borderBottomColor: notificationTab === 'unread' ? colors.accent : 'transparent',
                  color: notificationTab === 'unread' ? colors.accent : colors.textMuted
                }}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
              <button
                className={`tab-btn ${notificationTab === 'critical' ? 'active' : ''}`}
                onClick={() => setNotificationTab('critical')}
                style={{
                  borderBottomColor: notificationTab === 'critical' ? colors.accent : 'transparent',
                  color: notificationTab === 'critical' ? colors.accent : colors.textMuted
                }}
              >
                Critical
              </button>
              <button
                className={`tab-btn ${notificationTab === 'system' ? 'active' : ''}`}
                onClick={() => setNotificationTab('system')}
                style={{
                  borderBottomColor: notificationTab === 'system' ? colors.accent : 'transparent',
                  color: notificationTab === 'system' ? colors.accent : colors.textMuted
                }}
              >
                System
              </button>
            </div>

            <div className="notifications-list">
              {filteredNotifications.map((notification) => {
                const severityStyle = getSeverityColor(notification.severity || notification.priority);
                return (
                  <div
                    key={notification.id}
                    className={`notification-item card ${notification.status === 'unread' ? 'unread' : ''}`}
                    style={{
                      backgroundColor: notification.status === 'unread'
                        ? (theme === 'light' ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)')
                        : colors.bgCard,
                      borderColor: notification.status === 'unread'
                        ? (theme === 'light' ? '#bfdbfe' : 'rgba(59, 130, 246, 0.3)')
                        : colors.border
                    }}
                  >
                    <div className="notification-content">
                      <div className="notification-icon">
                        {getNotificationIcon(notification.eventType)}
                      </div>
                      <div className="notification-body">
                        <div className="notification-header">
                          <h4 className="notification-title">{notification.title}</h4>
                          {notification.status === 'unread' && (
                            <span className="unread-dot" style={{ backgroundColor: colors.info }}></span>
                          )}
                          <span className="notification-priority" style={{
                            color: severityStyle.color,
                            backgroundColor: severityStyle.bg
                          }}>
                            {notification.severity || notification.priority}
                          </span>
                        </div>
                        <p className="notification-message" style={{ color: colors.textMuted }}>
                          {notification.message}
                        </p>
                        <div className="notification-footer">
                          <span className="notification-time" style={{ color: colors.textMuted }}>
                            <FiClock size={12} /> {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                          </span>
                          <div className="notification-actions">
                            <button
                              className="btn-notification-action"
                              onClick={() => handleMarkAsRead(notification.id)}
                              style={{ color: colors.textMuted }}
                            >
                              Mark as Read
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredNotifications.length === 0 && (
                <div className="empty-notifications" style={{ color: colors.textMuted }}>
                  No notifications found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Log Detail Modal */}
        {showLogDetail && selectedLog && (
          <div className="modal-overlay" onClick={() => setShowLogDetail(false)}>
            <div className="modal-content-large card" style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.border
            }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-badges">
                  <span className="modal-badge" style={{ borderColor: colors.border }}>
                    {selectedLog.eventType}
                  </span>
                  <span className="modal-badge-severity" style={getSeverityColor(selectedLog.severity)}>
                    {getSeverityIcon(selectedLog.severity)}
                    <span style={{ marginLeft: '4px' }}>{selectedLog.severity}</span>
                  </span>
                </div>
                <h3 className="modal-title">{selectedLog.description}</h3>
                <p className="modal-time" style={{ color: colors.textMuted }}>
                  <FiClock size={16} /> {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : ''}
                </p>
              </div>
              <div className="modal-body">
                <div className="modal-details">
                  <div className="detail-item">
                    <span className="detail-label" style={{ color: colors.textMuted }}>IP Address</span>
                    <span className="detail-value">{selectedLog.ipAddress || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ color: colors.textMuted }}>Status</span>
                    <span className="detail-value">{selectedLog.status}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ color: colors.textMuted }}>User</span>
                    <span className="detail-value">{selectedLog.user?.email || 'System'}</span>
                  </div>
                  {selectedLog.device && (
                    <div className="detail-item">
                      <span className="detail-label" style={{ color: colors.textMuted }}>Device</span>
                      <span className="detail-value">{selectedLog.device.deviceName}</span>
                    </div>
                  )}
                </div>
                {selectedLog.metadata && (
                  <div className="modal-raw-data">
                    <h4 className="raw-data-title" style={{ color: colors.textMuted }}>Raw Data</h4>
                    <pre className="raw-data-content" style={{
                      backgroundColor: theme === 'light' ? '#f3f4f6' : '#1c1c1c',
                      color: colors.text
                    }}>
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn-modal-close"
                  onClick={() => setShowLogDetail(false)}
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  Close
                </button>
                <button
                  className="btn-modal-export"
                  onClick={() => {/* Export this log */ }}
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  <FiDownload size={16} /> Export This Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Dialog */}
        {showExportDialog && (
          <div className="modal-overlay" onClick={() => setShowExportDialog(false)}>
            <div className="modal-content card" style={{
              backgroundColor: colors.bgCard,
              borderColor: colors.border
            }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Export Logs</h3>
                <p className="modal-description" style={{ color: colors.textMuted }}>
                  Configure export settings for your activity logs
                </p>
              </div>
              <div className="modal-body">
                <div className="export-options">
                  <div className="export-option">
                    <label className="export-label" style={{ color: colors.textMuted }}>Export Format</label>
                    <select
                      className="export-select"
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      style={{
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.text
                      }}
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div className="export-preview" style={{
                    backgroundColor: theme === 'light' ? '#eff6ff' : 'rgba(59, 130, 246, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginTop: '16px'
                  }}>
                    <FiDatabase size={16} style={{ color: colors.info, display: 'inline', marginRight: '8px' }} />
                    <span style={{ color: colors.textMuted }}>Estimated: ~{logs.length} records</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn-modal-close"
                  onClick={() => setShowExportDialog(false)}
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  Cancel
                </button>
                <button
                  className="btn-modal-export"
                  onClick={handleExport}
                  style={{
                    backgroundColor: colors.accent,
                    color: '#fff',
                    borderColor: colors.accent
                  }}
                >
                  <FiDownload size={16} /> Generate Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsAndReporting;

