import React, { useState, useEffect } from 'react';

import api from '../services/api';

// Same idea as App.js / ScanDashboard
const darkPalette = {
  bgMain: '#121212',
  bgCard: '#181818',
  bgPanel: '#0a0a0a',
  text: '#ffffff',
  textMuted: '#9aa3b5',
  border: '#242424',
  accent: '#36E27B',
  accentSoft: 'rgba(54,226,123,0.12)',
  warning: '#f0a500',
  danger: '#e04848',
  inputBg: '#18181b',
  inputBorder: '#27272a',
};

const lightPalette = {
  bgMain: '#f6f8fb',
  bgCard: '#ffffff',
  bgPanel: '#eef3f8',
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

const makeStyles = (c) => ({
  container: {
    padding: 20,
    maxWidth: 1400,
    margin: '0 auto',
    color: c.text,
    fontFamily: 'sans-serif',
  },
  headerTitle: {
    margin: 0,
    color: c.text,
    fontSize: 30,
    fontWeight: 700,
  },
  logsSection: {
    backgroundColor: c.bgCard,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  logsEmpty: {
    textAlign: 'center',
    color: c.textMuted,
    padding: 20,
  },
  logCard: {
    backgroundColor: c.bgPanel,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    padding: 16,
  },
  logDate: {
    fontSize: 14,
    color: c.accent,
    fontFamily: 'monospace',
  },
  logDescription: {
    color: c.textMuted,
    marginTop: 4,
    fontSize: 14,
  },
  profileFormContainer: {
    backgroundColor: c.bgCard,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    padding: 24,
    marginBottom: 28,
  },
  formSection: {
    backgroundColor: c.bgPanel,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    padding: 20,
  },
  formInput: {
    width: '100%',
    padding: 8,
    backgroundColor: c.inputBg,
    border: `1px solid ${c.inputBorder}`,
    borderRadius: 8,
    fontSize: 14,
    color: c.text,
  },
  textArea: {
    width: '100%',
    padding: 8,
    backgroundColor: c.inputBg,
    border: `1px solid ${c.inputBorder}`,
    borderRadius: 8,
    fontSize: 14,
    color: c.text,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: 8,
    backgroundColor: c.inputBg,
    border: `1px solid ${c.inputBorder}`,
    borderRadius: 8,
    fontSize: 14,
    color: c.text,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,              
    fontSize: 14,
    color: c.text,
  },
  fieldHint: {
    display: 'block',
    marginTop: 4,
    color: c.textMuted,
    fontSize: 12,
  },
  profileCard: {
    backgroundColor: c.bgCard,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    padding: 20,
  },
  profileCardActive: (isActive) =>
    isActive
      ? {
          backgroundColor: c.bgCard,
          border: `1px solid ${c.accent}`,
          borderRadius: 12,
          padding: 20,
        }
      : undefined,
  profileDescription: {
    color: c.textMuted,
  },
  profileMeta: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 12,
  },
  statusEnabled: {
    color: c.accent,
  },
  statusDisabled: {
    color: c.danger,
  },
});

const ProfileManager = ({ theme = 'dark', palette }) => {
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);
  const styles = makeStyles(colors);

  const [profiles, setProfiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    profileType: 'Custom',

    // VPN
    vpnEnabled: false,
    vpnServer: '',
    vpnProtocol: 'OpenVPN',
    vpnPort: '',
    vpnUsername: '',

    // Firewall
    firewallEnabled: true,
    defaultFirewallAction: 'DENY',
    firewallRules: '',

    // Access Control
    allowedIps: '',
    blockedIps: '',
    allowedPorts: '',
    blockedPorts: '',

    // Scheduling
    isScheduled: false,
    scheduleType: 'NONE',
    scheduleStartTime: '',
    scheduleEndTime: '',
    scheduleDays: [],
    scheduleCondition: '',
    autoActivate: false,
  });

  useEffect(() => {
    fetchProfiles();
    fetchLogs();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await api.get('/profiles');
      setProfiles(response.data.profiles);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await api.get('/profiles/logs/all');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleDayToggle = (day) => {
    const days = formData.scheduleDays || [];
    if (days.includes(day)) {
      setFormData({
        ...formData,
        scheduleDays: days.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        scheduleDays: [...days, day],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,

        vpnPort:
          formData.vpnPort && !isNaN(formData.vpnPort)
            ? parseInt(formData.vpnPort)
            : null,

        firewallRules: formData.firewallRules
          ? formData.firewallRules
              .split(',')
              .map((r) => r.trim())
              .filter((r) => r !== '')
          : [],

        allowedIps: formData.allowedIps
          ? formData.allowedIps
              .split(',')
              .map((ip) => ip.trim())
              .filter((ip) => ip !== '')
          : [],

        blockedIps: formData.blockedIps
          ? formData.blockedIps
              .split(',')
              .map((ip) => ip.trim())
              .filter((ip) => ip !== '')
          : [],

        allowedPorts: formData.allowedPorts
          ? formData.allowedPorts
              .split(',')
              .map((p) => p.trim())
              .filter((p) => p !== '' && !isNaN(p))
              .map(Number)
          : [],

        blockedPorts: formData.blockedPorts
          ? formData.blockedPorts
              .split(',')
              .map((p) => p.trim())
              .filter((p) => p !== '' && !isNaN(p))
              .map(Number)
          : [],
      };

      if (editingProfile) {
        await api.put(`/profiles/${editingProfile.id}`, submitData);
        alert('Profile updated successfully!');
      } else {
        await api.post(`/profiles`, submitData);
        alert('Profile created successfully!');
      }

      setShowForm(false);
      setEditingProfile(null);
      resetForm();
      fetchProfiles();
      fetchLogs();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(
        'Error saving profile: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || '',
      profileType: profile.profileType,

      vpnEnabled: profile.vpnEnabled,
      vpnServer: profile.vpnServer || '',
      vpnProtocol: profile.vpnProtocol || 'OpenVPN',
      vpnPort: profile.vpnPort || '',
      vpnUsername: profile.vpnUsername || '',

      firewallEnabled: profile.firewallEnabled,
      defaultFirewallAction: profile.defaultFirewallAction || 'DENY',
      firewallRules: Array.isArray(profile.firewallRules)
        ? profile.firewallRules.join(', ')
        : '',

      dnsEnabled: profile.dnsEnabled,
      primaryDns: profile.primaryDns || '',
      secondaryDns: profile.secondaryDns || '',
      dnsSecurity: profile.dnsSecurity,

      allowedIps: Array.isArray(profile.allowedIps)
        ? profile.allowedIps.join(', ')
        : '',
      blockedIps: Array.isArray(profile.blockedIps)
        ? profile.blockedIps.join(', ')
        : '',
      allowedPorts: Array.isArray(profile.allowedPorts)
        ? profile.allowedPorts.join(', ')
        : '',
      blockedPorts: Array.isArray(profile.blockedPorts)
        ? profile.blockedPorts.join(', ')
        : '',

      isScheduled: profile.isScheduled,
      scheduleType: profile.scheduleType || 'NONE',
      scheduleStartTime: profile.scheduleStartTime || '',
      scheduleEndTime: profile.scheduleEndTime || '',
      scheduleDays: profile.scheduleDays || [],
      scheduleCondition: profile.scheduleCondition || '',
      autoActivate: profile.autoActivate,
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this profile?')) {
      try {
        await api.put(`/profiles/${id}/deactivate`, {});
        alert('Profile deactivated successfully!');
        fetchProfiles();
        fetchLogs();
      } catch (error) {
        console.error('Error deactivating profile:', error);
        alert('Error deactivating profile');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await api.delete(`/profiles/${id}`);
        alert('Profile deleted successfully!');
        fetchProfiles();
        fetchLogs();
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Error deleting profile');
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`/profiles/${id}/activate`, {});
      alert('Profile activated successfully!');
      fetchProfiles();
      fetchLogs();
    } catch (error) {
      console.error('Error activating profile:', error);
      alert('Error activating profile');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      profileType: 'Custom',
      vpnEnabled: false,
      vpnServer: '',
      vpnProtocol: 'OpenVPN',
      vpnPort: '',
      vpnUsername: '',
      firewallEnabled: true,
      defaultFirewallAction: 'DENY',
      firewallRules: '',
      dnsEnabled: false,
      primaryDns: '',
      secondaryDns: '',
      allowedIps: '',
      blockedIps: '',
      allowedPorts: '',
      blockedPorts: '',
      isScheduled: false,
      scheduleType: 'NONE',
      scheduleStartTime: '',
      scheduleEndTime: '',
      scheduleDays: [],
      scheduleCondition: '',
      autoActivate: false,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProfile(null);
    resetForm();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'CREATED':
        return 'badge-created';
      case 'UPDATED':
        return 'badge-updated';
      case 'DELETED':
        return 'badge-deleted';
      case 'ACTIVATED':
        return 'badge-activated';
      case 'DEACTIVATED':
        return 'badge-deactivated';
      default:
        return 'badge-default';
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ color: colors.text }}>
        Loading profiles...
      </div>
    );
  }

  return (
    <div className="profile-manager" style={styles.container}>
      {/* Header */}
        <div
          className="pm-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <h2 style={styles.headerTitle}>Security Profile Management</h2>

          <div
            className="header-actions"
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
          >
            <button
              onClick={() => setShowLogs(!showLogs)}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                backgroundColor: showLogs ? colors.accentSoft : colors.bgCard,
                color: colors.text,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {showLogs ? 'Hide Logs' : 'View Activity Logs'}
            </button>

            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                backgroundColor: colors.accent,
                color: theme === 'dark' ? '#121212' : '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
              }}
            >
              Create New Profile
            </button>
          </div>
        </div>


      {/* Activity Logs Section */}
      {showLogs && (
  <div className="logs-section" style={styles.logsSection}>
    <h3 style={{ marginTop: 0, marginBottom: 16, color: colors.text }}>
      Activity Logs
    </h3>
    {logs.length === 0 ? (
      <p className="no-logs" style={styles.logsEmpty}>
        No activity logs yet.
      </p>
    ) : (
      <div
        className="logs-container"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {logs.map((log) => (
          <div key={log.id} className="log-card" style={styles.logCard}>
            <div
              className="log-card-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span className="log-date" style={styles.logDate}>
                {formatDate(log.createdAt)}
              </span>

              {/* 👇 change only this span */}
              <span
                className={`action-badge ${getActionBadgeClass(log.action)}`}
                style={{
                  padding: '3px 8px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  backgroundColor:
                    log.action === 'DEACTIVATED'
                      ? 'rgba(249,115,22,0.12)' // orange bg
                      : colors.accentSoft,        // green-ish for others
                  color:
                    log.action === 'DEACTIVATED'
                      ? '#f97316'                // orange text
                      : colors.accent,           // green text for others
                }}
              >
                {log.action}
              </span>
            </div>

            <div className="log-card-body">
              <p>
                <span className="log-label">Profile:</span>{' '}
                <span
                  className={`log-profile ${
                    !log.profile?.name ? 'deleted' : ''
                  }`}
                  style={{
                    color: log.profile?.name ? colors.accent : colors.danger,
                    fontWeight: 600,
                    textDecoration: log.profile?.name ? 'underline' : 'none',
                  }}
                >
                  {log.profile?.name ||
                    log.description?.match(/"([^"]+)"/)?.[1] ||
                    'Deleted'}
                </span>
              </p>

              <p>
                <span className="log-label">User:</span>{' '}
                <span className="log-email">{log.userEmail}</span>
              </p>

              {log.description && (
                <p
                  className="log-description"
                  style={styles.logDescription}
                >
                  {log.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}


      {/* Profile Form */}
      {showForm && (
        <div
          className="profile-form-container"
          style={styles.profileFormContainer}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 16,
              color: colors.text,
              fontSize: 24,
              fontWeight: 'bold',
            }}
          >
            {editingProfile ? 'Edit Profile' : 'Create New Profile'}
          </h3>
          <form onSubmit={handleSubmit} className="profile-form">
            {/* Basic Information */}
            <div className="form-section" style={styles.formSection}>
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  color: colors.accent,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Basic Information
              </h4>

              <div className="form-group">
                <label>Profile Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  style={styles.formInput}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="form-textarea"
                  style={styles.textArea}
                />
              </div>
            </div>

            {/* VPN Settings */}
            <div className="form-section" style={styles.formSection}>
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  color: colors.accent,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                VPN Settings
              </h4>

              <label
                className="checkbox-label"
                style={styles.checkboxLabel}
              >
                <input
                  type="checkbox"
                  name="vpnEnabled"
                  checked={formData.vpnEnabled}
                  onChange={handleInputChange}
                />
                <span>Enable VPN</span>
              </label>


              {formData.vpnEnabled && (
                <div className="nested-fields">
                  <div className="form-group">
                    <label>VPN Server Address</label>
                    <input
                      type="text"
                      name="vpnServer"
                      placeholder="vpn.example.com"
                      value={formData.vpnServer}
                      onChange={handleInputChange}
                      className="form-input"
                      style={styles.formInput}
                    />
                  </div>

                  <div className="form-group">
                    <label>Protocol</label>
                    <select
                      name="vpnProtocol"
                      value={formData.vpnProtocol}
                      onChange={handleInputChange}
                      className="form-select"
                      style={styles.select}
                    >
                      <option value="OpenVPN">OpenVPN</option>
                      <option value="WireGuard">WireGuard</option>
                      <option value="IKEv2">IKEv2</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Port</label>
                    <input
                      type="number"
                      name="vpnPort"
                      placeholder="1194"
                      value={formData.vpnPort}
                      onChange={handleInputChange}
                      className="form-input"
                      style={styles.formInput}
                    />
                  </div>

                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="vpnUsername"
                      placeholder="username"
                      value={formData.vpnUsername}
                      onChange={handleInputChange}
                      className="form-input"
                      style={styles.formInput}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Firewall Settings */}
            <div className="form-section" style={styles.formSection}>
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  color: colors.accent,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Firewall Settings
              </h4>
              <label
                className="checkbox-label"
                style={styles.checkboxLabel}
              >
                <input
                  type="checkbox"
                  name="firewallEnabled"
                  checked={formData.firewallEnabled}
                  onChange={handleInputChange}
                />
                <span>Enable Firewall</span>
              </label>


              {formData.firewallEnabled && (
                <div className="nested-fields">
                  <div className="form-group">
                    <label>Default Action</label>
                    <select
                      name="defaultFirewallAction"
                      value={formData.defaultFirewallAction}
                      onChange={handleInputChange}
                      className="form-select"
                      style={styles.select}
                    >
                      <option value="ALLOW">
                        Allow All (Blacklist Mode)
                      </option>
                      <option value="DENY">
                        Deny All (Whitelist Mode)
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Custom Rules (comma-separated)</label>
                    <input
                      type="text"
                      name="firewallRules"
                      placeholder="rule1, rule2, rule3"
                      value={formData.firewallRules}
                      onChange={handleInputChange}
                      className="form-input"
                      style={styles.formInput}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Access Control */}
            <div className="form-section" style={styles.formSection}>
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  color: colors.accent,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Access Control
              </h4>

              <div className="form-group">
                <label>Allowed IPs (comma-separated)</label>
                <input
                  type="text"
                  name="allowedIps"
                  placeholder="192.168.1.1, 10.0.0.1"
                  value={formData.allowedIps}
                  onChange={handleInputChange}
                  className="form-input"
                  style={styles.formInput}
                />
              </div>

              <div className="form-group">
                <label>Blocked IPs (comma-separated)</label>
                <input
                  type="text"
                  name="blockedIps"
                  placeholder="192.168.1.100, 10.0.0.50"
                  value={formData.blockedIps}
                  onChange={handleInputChange}
                  className="form-input"
                  style={styles.formInput}
                />
              </div>

              <div className="form-group">
                <label>Allowed Ports (comma-separated)</label>
                <input
                  type="text"
                  name="allowedPorts"
                  placeholder="80, 443, 8080"
                  value={formData.allowedPorts}
                  onChange={handleInputChange}
                  className="form-input"
                  style={styles.formInput}
                />
              </div>

              <div className="form-group">
                <label>Blocked Ports (comma-separated)</label>
                <input
                  type="text"
                  name="blockedPorts"
                  placeholder="21, 23, 25"
                  value={formData.blockedPorts}
                  onChange={handleInputChange}
                  className="form-input"
                  style={styles.formInput}
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="form-section" style={styles.formSection}>
              <h4
                style={{
                  marginTop: 0,
                  marginBottom: 16,
                  color: colors.accent,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                Scheduling
              </h4>

              <label
                className="checkbox-label"
                style={styles.checkboxLabel}
              >
                <input
                  type="checkbox"
                  name="isScheduled"
                  checked={formData.isScheduled}
                  onChange={handleInputChange}
                />
                <span>Enable Scheduling</span>
              </label>


              {formData.isScheduled && (
                <div className="nested-fields">
                  <div className="form-group">
                    <label>Schedule Type</label>
                    <select
                      name="scheduleType"
                      value={formData.scheduleType}
                      onChange={handleInputChange}
                      className="form-select"
                      style={styles.select}
                    >
                      <option value="NONE">None</option>
                      <option value="TIME">Time-Based</option>
                      <option value="CONDITION">Condition-Based</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>

                  {(formData.scheduleType === 'TIME' ||
                    formData.scheduleType === 'BOTH') && (
                    <>
                      <div className="form-group">
                        <label>Start Time</label>
                        <input
                          type="time"
                          name="scheduleStartTime"
                          value={formData.scheduleStartTime}
                          onChange={handleInputChange}
                          className="form-input"
                          style={styles.formInput}
                        />
                      </div>

                      <div className="form-group">
                        <label>End Time</label>
                        <input
                          type="time"
                          name="scheduleEndTime"
                          value={formData.scheduleEndTime}
                          onChange={handleInputChange}
                          className="form-input"
                          style={styles.formInput}
                        />
                      </div>

                      <div className="form-group">
                        <label>Active Days</label>
                        <div className="days-selector">
                          {[
                            'Monday',
                            'Tuesday',
                            'Wednesday',
                            'Thursday',
                            'Friday',
                            'Saturday',
                            'Sunday',
                          ].map((day) => (
                            <label key={day} className="day-checkbox">
                              <input
                                type="checkbox"
                                checked={formData.scheduleDays.includes(day)}
                                onChange={() => handleDayToggle(day)}
                              />
                              <span>{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {(formData.scheduleType === 'CONDITION' ||
                    formData.scheduleType === 'BOTH') && (
                    <div className="form-group">
                      <label>Activation Condition</label>
                      <input
                        type="text"
                        name="scheduleCondition"
                        placeholder="e.g., WiFi network name, IP range"
                        value={formData.scheduleCondition}
                        onChange={handleInputChange}
                        className="form-input"
                        style={styles.formInput}
                      />
                      <small
                        className="field-hint"
                        style={styles.fieldHint}
                      >
                        Example: "Public WiFi", "192.168.1.x",
                        "Outside office hours"
                      </small>
                    </div>
                  )}

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="autoActivate"
                      checked={formData.autoActivate}
                      onChange={handleInputChange}
                    />
                    <span>Auto-activate when conditions are met</span>
                  </label>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div
              className="form-actions"
              style={{
                marginTop: 20,
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: colors.accent,
                  color: theme === 'dark' ? '#121212' : '#ffffff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {editingProfile ? 'Update Profile' : 'Create Profile'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.bgCard,
                  color: colors.text,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Profiles List */}
<div className="profiles-section">
  <h3
    style={{
      marginBottom: 16,
      color: colors.text,
      fontSize: 20,
      fontWeight: 600,
    }}
  >
    Your Profiles ({profiles.length})
  </h3>
  {profiles.length === 0 ? (
    <div className="empty-state">
      <p style={{ color: colors.textMuted }}>
        No profiles yet. Create your first security profile!
      </p>
    </div>
  ) : (
    <div
      className="profiles-grid"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className={`profile-card ${
            profile.isActive ? 'active-profile' : ''
          }`}
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 12,
            border: `1px solid ${
              profile.isActive ? colors.accent : colors.border
            }`,
            padding: 20,
          }}
        >
          <div
            className="profile-content"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            {/* LEFT: info */}
            <div
              className="profile-info"
              style={{ flex: 1, minWidth: 0 }}
            >
              <div
                className="profile-title"
                style={{
                  marginBottom: 10,
                }}
              >
                {/* Name on its own line */}
                <h4
                  style={{
                    margin: 0,
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {profile.name}
                </h4>

                {/* Badges on a separate, smaller row */}
                <div
                  className="profile-badges"
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginTop: 4,
                  }}
                >
                  {profile.isActive && (
                    <span
                      className="badge badge-active"
                      style={{
                        padding: '3px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: colors.accent,
                        color: theme === 'dark' ? '#121212' : '#ffffff',
                      }}
                    >
                      ● ACTIVE
                    </span>
                  )}
                  <span
                    className="badge badge-type"
                    style={{
                      padding: '3px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      backgroundColor: colors.accentSoft,
                      color: colors.accent,
                      fontWeight: 500,
                    }}
                  >
                    {profile.profileType}
                  </span>
                </div>
              </div>


              {profile.description && (
                <p
                  style={{
                    color: colors.textMuted,
                    marginBottom: 12,
                  }}
                >
                  {profile.description}
                </p>
              )}

              {/* Settings Summary */}
              <div className="settings-summary">
                <div className="setting-item">
                  <strong>VPN:</strong>{' '}
                  {profile.vpnEnabled ? (
                    <span
                      style={{ color: colors.accent, fontWeight: 500 }}
                    >
                      ✓ Enabled ({profile.vpnProtocol})
                    </span>
                  ) : (
                    <span
                      style={{ color: colors.danger, fontWeight: 500 }}
                    >
                      ✗ Disabled
                    </span>
                  )}
                </div>

                <div className="setting-item">
                  <strong>Firewall:</strong>{' '}
                  {profile.firewallEnabled ? (
                    <span
                      style={{ color: colors.accent, fontWeight: 500 }}
                    >
                      ✓ Enabled ({profile.defaultFirewallAction})
                    </span>
                  ) : (
                    <span
                      style={{ color: colors.danger, fontWeight: 500 }}
                    >
                      ✗ Disabled
                    </span>
                  )}
                </div>

                <div className="setting-item">
                  <strong>Scheduling:</strong>{' '}
                  {profile.isScheduled ? (
                    <span
                      style={{ color: colors.accent, fontWeight: 500 }}
                    >
                      ✓ {profile.scheduleType}
                    </span>
                  ) : (
                    <span
                      style={{ color: colors.danger, fontWeight: 500 }}
                    >
                      ✗ None
                    </span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div
                className="profile-meta"
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  marginTop: 12,
                }}
              >
                <p>Created: {formatDate(profile.createdAt)}</p>
                {profile.lastActivatedAt && (
                  <p>
                    Last Activated:{' '}
                    {formatDate(profile.lastActivatedAt)} (
                    {profile.activationCount} times)
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: actions (top-right) */}
            <div
              className="profile-actions"
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'flex-end',
                minWidth: 260,
              }}
            >
              {/* Activate / Deactivate – transparent, outlined */}
              {!profile.isActive ? (
                <button
                  onClick={() => handleActivate(profile.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: `1px solid ${colors.accent}`,
                    backgroundColor: 'transparent',
                    color: colors.accent,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Activate
                </button>
              ) : (
                <button
                  onClick={() => handleDeactivate(profile.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid #f97316',
                    backgroundColor: 'transparent',
                    color: '#f97316',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Deactivate
                </button>
              )}

              {/* Edit – subtle neutral outline */}
              <button
                onClick={() => handleEdit(profile)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: 'transparent',
                  color: colors.text,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>

              {/* Delete – transparent red outline */}
              <button
                onClick={() => handleDelete(profile.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid #dc2626',
                  backgroundColor: 'transparent',
                  color: '#fca5a5',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      ))}
    </div>
  )}
</div>

    </div>
  );
};

export default ProfileManager;
