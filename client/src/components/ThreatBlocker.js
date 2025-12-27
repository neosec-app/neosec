import React, { useState, useEffect, useCallback } from 'react';
import { threatBlockerAPI, getErrorMessage } from '../services/api';
import { FiShield, FiRefreshCw, FiClock, FiDatabase, FiTrendingUp, FiGlobe, FiAlertTriangle, FiDownload, FiSearch } from 'react-icons/fi';
import './ThreatBlocker.css'; 

const ThreatBlocker = ({ theme = 'dark', palette }) => {
  const darkPalette = {
    bgMain: '#121212',
    bgCard: '#181818',
    text: '#ffffff',
    textMuted: '#9aa3b5',
    border: '#242424',
    accent: '#36E27B',
    accentSoft: 'rgba(54,226,123,0.12)',
    warning: '#f0a500',
    danger: '#e04848',
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
    accentSoft: '#e6f4ed',
    warning: '#d97706',
    danger: '#d4183d',
    inputBg: '#ffffff',
    inputBorder: '#d9e2ec',
  };

  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [status, setStatus] = useState(null);
  const [blocklist, setBlocklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [availableSources, setAvailableSources] = useState([]);
  const [availableThreatTypes, setAvailableThreatTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [autoBlockingEnabled, setAutoBlockingEnabled] = useState(true);
  const [updateFrequency, setUpdateFrequency] = useState('daily');
  const [autoApply, setAutoApply] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const response = await threatBlockerAPI.getStatus();
      if (response.success) {
        setStatus(response.data);
        setAutoBlockingEnabled(response.data.enabled);
        // Extract unique sources from status
        if (response.data.sources && Array.isArray(response.data.sources)) {
          setAvailableSources(response.data.sources);
        }
        // Extract unique threat types from status
        if (response.data.threatTypes && Array.isArray(response.data.threatTypes)) {
          setAvailableThreatTypes(response.data.threatTypes.sort());
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBlocklist = useCallback(async () => {
    try {
      const params = {
        page,
        limit: 10,
        search: searchQuery || undefined,
        threatType: filterType !== 'all' ? filterType : undefined,
        source: filterSource !== 'all' ? filterSource : undefined,
      };
      const response = await threatBlockerAPI.getBlocklist(params);
      if (response.success) {
        setBlocklist(response.data.blocklist || []);
        setPagination(response.data.pagination);
        
        // Extract unique sources and threat types from blocklist data dynamically
        const sources = new Set();
        const threatTypes = new Set();
        if (response.data.blocklist && Array.isArray(response.data.blocklist)) {
          response.data.blocklist.forEach(item => {
            if (item.source) {
              sources.add(item.source);
            }
            if (item.threatType) {
              threatTypes.add(item.threatType);
            }
          });
        }
        // Merge with existing sources and update if new sources found
        if (sources.size > 0) {
          setAvailableSources(prev => {
            const combined = new Set([...prev, ...sources]);
            return Array.from(combined).sort();
          });
        }
        // Merge with existing threat types and update if new threat types found
        if (threatTypes.size > 0) {
          setAvailableThreatTypes(prev => {
            const combined = new Set([...prev, ...threatTypes]);
            return Array.from(combined).sort();
          });
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [page, filterType, filterSource, searchQuery]);

  useEffect(() => {
    loadStatus();
    loadBlocklist();
  }, [loadStatus, loadBlocklist, page, filterType, filterSource, searchQuery]);

  // Auto-refresh status every 30 seconds to show dynamic updates
  useEffect(() => {
    if (!autoBlockingEnabled) return;
    
    const interval = setInterval(() => {
      loadStatus();
      // Only refresh blocklist if we're on first page and no filters
      if (page === 1 && filterType === 'all' && filterSource === 'all' && !searchQuery) {
        loadBlocklist();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoBlockingEnabled, page, filterType, filterSource, searchQuery, loadStatus, loadBlocklist]);

  const handleForceUpdate = async () => {
    setUpdating(true);
    setError('');
    try {
      const response = await threatBlockerAPI.forceUpdate();
      if (response.success) {
        setShowUpdateModal(true);
        setTimeout(() => setShowUpdateModal(false), 5000);
        loadStatus();
        loadBlocklist();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await threatBlockerAPI.exportBlocklist('csv');
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'blocklist.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to export blocklist'));
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
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

  // Note: Filtering is now done on the backend, but keeping this for client-side search if needed
  const filteredBlocklist = blocklist.filter(item => {
    const matchesSearch = !searchQuery || item.ipAddress.includes(searchQuery) ||
      item.threatType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || item.threatType === filterType;
    const matchesSource = filterSource === 'all' || item.source === filterSource;
    return matchesSearch && matchesFilter && matchesSource;
  });

  if (loading && !status) {
    return (
      <div className="threat-blocker-container" style={{ backgroundColor: colors.bgMain, color: colors.text }}>
        <div className="loading-state">Loading threat blocker status...</div>
      </div>
    );
  }

  return (
    <div className="threat-blocker-container" style={{ backgroundColor: colors.bgMain, color: colors.text }}>
      <div className="threat-blocker-content">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Automatic Threat Blocker</h1>
          <p className="page-description" style={{ color: colors.textMuted }}>
            Automatically block malicious IPs and threats using real-time threat intelligence feeds
          </p>
        </div>

        {error && (
          <div className="error-message" style={{
            backgroundColor: theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
            color: colors.danger,
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* Status Section */}
        <div className="status-card card" style={{
          backgroundColor: colors.bgCard,
          borderColor: colors.border
        }}>
          <div className="status-content">
            <div className="status-left">
              <div className="status-icon-wrapper" style={{
                backgroundColor: autoBlockingEnabled
                  ? (theme === 'light' ? '#e6f4ed' : 'rgba(54,226,123,0.12)')
                  : (theme === 'light' ? '#f3f4f6' : '#2c2c2c')
              }}>
                <FiShield style={{
                  color: autoBlockingEnabled ? colors.accent : colors.textMuted
                }} />
              </div>
              <div className="status-info">
                <div className="status-header">
                  <span className="status-title">Automatic Blocking</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={autoBlockingEnabled}
                      onChange={async (e) => {
                        const enabled = e.target.checked;
                        setAutoBlockingEnabled(enabled);
                        // Save settings to server
                        try {
                          await threatBlockerAPI.updateSettings({
                            updateFrequency: updateFrequency,
                            autoApply: autoApply,
                            enabled: enabled
                          });
                        } catch (err) {
                          console.error('Failed to save settings:', err);
                        }
                      }}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="status-badges">
                  <span className="status-badge" style={{
                    backgroundColor: autoBlockingEnabled
                      ? (theme === 'light' ? '#e6f4ed' : 'rgba(54,226,123,0.2)')
                      : (theme === 'light' ? '#f3f4f6' : '#2c2c2c'),
                    color: autoBlockingEnabled ? colors.accent : colors.textMuted
                  }}>
                    {autoBlockingEnabled ? 'Active' : 'Inactive'}
                  </span>
                  {autoBlockingEnabled && (
                    <span className="status-badge-auto" style={{ color: colors.textMuted }}>
                      <FiClock size={12} /> Auto-updating
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="status-right">
              <div className="last-update" style={{ color: colors.textMuted }}>
                <FiClock size={16} />
                <span>Last updated: {status ? formatTimeAgo(status.lastUpdate) : 'Never'}</span>
              </div>
              <button
                className="btn-force-update"
                onClick={handleForceUpdate}
                disabled={updating}
                style={{
                  borderColor: colors.accent,
                  color: colors.accent,
                  backgroundColor: 'transparent'
                }}
              >
                <FiRefreshCw size={16} className={updating ? 'spinning' : ''} />
                {updating ? 'Updating...' : 'Force Update'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card card" style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border
          }}>
            <div className="stat-header">
              <span className="stat-label" style={{ color: colors.textMuted }}>Total IPs in Blocklist</span>
              <FiDatabase size={16} style={{ color: colors.textMuted }} />
            </div>
            <div className="stat-value-row">
              <span className="stat-value">{status ? status.totalIPs.toLocaleString() : 0}</span>
              <span className="stat-trend" style={{ color: colors.accent }}>
                <FiTrendingUp size={12} /> +234
              </span>
            </div>
          </div>

          <div className="stat-card card" style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border
          }}>
            <div className="stat-header">
              <span className="stat-label" style={{ color: colors.textMuted }}>Threats Blocked Today</span>
              <FiShield size={16} style={{ color: colors.textMuted }} />
            </div>
            <div className="stat-value-row">
              <span className="stat-value">{status ? status.blockedToday : 0}</span>
              <span className="stat-trend" style={{ color: colors.accent }}>
                <FiTrendingUp size={12} /> +12%
              </span>
            </div>
          </div>

          <div className="stat-card card" style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border
          }}>
            <div className="stat-header">
              <span className="stat-label" style={{ color: colors.textMuted }}>Blocked This Week</span>
              <FiAlertTriangle size={16} style={{ color: colors.textMuted }} />
            </div>
            <div className="stat-value-row">
              <span className="stat-value">{status ? status.blockedThisWeek : 0}</span>
              <span className="stat-trend" style={{ color: colors.accent }}>
                <FiTrendingUp size={12} /> +8%
              </span>
            </div>
          </div>

          <div className="stat-card card" style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border
          }}>
            <div className="stat-header">
              <span className="stat-label" style={{ color: colors.textMuted }}>Update Source</span>
              <FiGlobe size={16} style={{ color: colors.textMuted }} />
            </div>
            <div className="stat-value">Multiple</div>
            <div className="stat-subtext" style={{ color: colors.textMuted }}>
              {status && status.sources ? status.sources.length : 5} active feeds
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="settings-card card" style={{
          backgroundColor: colors.bgCard,
          borderColor: colors.border
        }}>
          <h3 className="settings-title">Settings</h3>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-label">Update Frequency</div>
                <p className="setting-description" style={{ color: colors.textMuted }}>
                  How often to check for blocklist updates
                </p>
              </div>
              <select
                className="setting-select"
                value={updateFrequency}
                onChange={async (e) => {
                  const newFrequency = e.target.value;
                  setUpdateFrequency(newFrequency);
                  // Save settings to server
                  try {
                    await threatBlockerAPI.updateSettings({
                      updateFrequency: newFrequency,
                      autoApply: autoApply,
                      enabled: autoBlockingEnabled
                    });
                  } catch (err) {
                    console.error('Failed to save settings:', err);
                  }
                }}
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text
                }}
              >
                <option value="realtime">Real-time (every 5 min)</option>
                <option value="hourly">Every hour</option>
                <option value="6hours">Every 6 hours</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-label">Auto-apply Updates</div>
                <p className="setting-description" style={{ color: colors.textMuted }}>
                  Automatically apply new blocklist entries
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={autoApply}
                  onChange={async (e) => {
                    const apply = e.target.checked;
                    setAutoApply(apply);
                    // Save settings to server
                    try {
                      await threatBlockerAPI.updateSettings({
                        updateFrequency: updateFrequency,
                        autoApply: apply,
                        enabled: autoBlockingEnabled
                      });
                    } catch (err) {
                      console.error('Failed to save settings:', err);
                    }
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-label">Enable Notifications</div>
                <p className="setting-description" style={{ color: colors.textMuted }}>
                  Get notified when blocklist updates
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={async (e) => {
                    const enabled = e.target.checked;
                    setNotificationsEnabled(enabled);
                    // Save settings to server
                    try {
                      await threatBlockerAPI.updateSettings({
                        updateFrequency: updateFrequency,
                        autoApply: autoApply,
                        enabled: autoBlockingEnabled,
                        notificationsEnabled: enabled
                      });
                    } catch (err) {
                      console.error('Failed to save settings:', err);
                    }
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Blocklist Preview */}
        <div className="blocklist-card card" style={{
          backgroundColor: colors.bgCard,
          borderColor: colors.border
        }}>
          <div className="blocklist-header">
            <h3 className="blocklist-title">Blocklist Preview</h3>
            <div className="blocklist-actions">
              <button
                className="btn-export"
                onClick={handleExport}
                style={{
                  borderColor: colors.border,
                  color: colors.text
                }}
              >
                <FiDownload size={16} /> Export Blocklist
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="blocklist-filters">
            <div className="filter-search">
              <FiSearch size={16} className="search-icon" style={{ color: colors.textMuted }} />
              <input
                type="text"
                placeholder="Search IP address or threat type..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="filter-input"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text
                }}
              />
            </div>
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1); // Reset to first page on filter change
              }}
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text
              }}
            >
              <option value="all">All Types</option>
              {availableThreatTypes.length > 0 ? (
                availableThreatTypes.map((threatType) => (
                  <option key={threatType} value={threatType}>
                    {threatType}
                  </option>
                ))
              ) : (
                // Fallback options if no threat types loaded yet
                <>
                  <option value="Malware C&C">Malware C&C</option>
                  <option value="Botnet">Botnet</option>
                  <option value="Malware Host">Malware Host</option>
                  <option value="Brute Force">Brute Force</option>
                  <option value="Phishing">Phishing</option>
                  <option value="DDoS">DDoS</option>
                  <option value="Spam">Spam</option>
                  <option value="Exploit">Exploit</option>
                  <option value="Suspicious">Suspicious</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
            <select
              className="filter-select"
              value={filterSource}
              onChange={(e) => {
                setFilterSource(e.target.value);
                setPage(1); // Reset to first page on filter change
              }}
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text
              }}
            >
              <option value="all">All Sources</option>
              {availableSources.length > 0 ? (
                availableSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))
              ) : (
                <>
                  <option value="AbuseIPDB">AbuseIPDB</option>
                  <option value="Blocklist.de">Blocklist.de</option>
                  <option value="Tor Exit Nodes">Tor Exit Nodes</option>
                </>
              )}
            </select>
          </div>

          {/* Table */}
          <div className="blocklist-table-wrapper">
            <table className="blocklist-table">
              <thead>
                <tr style={{ borderBottomColor: colors.border }}>
                  <th>IP Address</th>
                  <th>Threat Type</th>
                  <th>Added Date</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlocklist.length > 0 ? (
                  filteredBlocklist.map((item) => (
                    <tr key={item.id} style={{ borderBottomColor: colors.border }}>
                      <td className="ip-address">{item.ipAddress}</td>
                      <td>
                        <span className="threat-badge" style={{
                          borderColor: theme === 'light' ? '#fecaca' : 'rgba(239, 68, 68, 0.3)',
                          color: colors.danger
                        }}>
                          {item.threatType}
                        </span>
                      </td>
                      <td style={{ color: colors.textMuted }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ color: colors.textMuted }}>{item.source}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="empty-state" style={{ color: colors.textMuted }}>
                      No threats found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="pagination">
              <div className="pagination-info" style={{ color: colors.textMuted }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} entries
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

      {/* Update Success Modal */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content card" style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border
          }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-success" style={{
                backgroundColor: theme === 'light' ? '#e6f4ed' : 'rgba(54,226,123,0.12)'
              }}>
                <FiShield size={24} style={{ color: colors.accent }} />
              </div>
              <h3 className="modal-title">Blocklist Updated Successfully</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: colors.textMuted }}>
                234 new threats added to the blocklist
              </p>
              <p className="modal-time" style={{ color: colors.textMuted }}>
                Updated at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatBlocker;

