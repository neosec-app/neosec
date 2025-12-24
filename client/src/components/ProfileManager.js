import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import ShareCreationModal from './ShareCreationModal';
import ShareManagement from './ShareManagement';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
countries.registerLocale(enLocale);

const ConfirmModal = ({ message, onConfirm, onCancel, colors }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            color: colors.text,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          localhost:3000 says
        </h3>
        <p
          style={{
            margin: '0 0 24px 0',
            color: colors.textMuted,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: colors.accent,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            OK
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: colors.danger,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast notification component
const Toast = ({message, type, onClose, colors = {}, theme = 'dark' }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getBgColor = () => {
    if (type === 'success') return theme === 'dark' ? '#1a3a2a' : 'rgba(31,164,90,0.1)';
    if (type === 'error') return theme === 'dark' ? '#2A1515' : 'rgba(212,24,61,0.08)';
    return theme === 'dark' ? '#2a2a1a' : 'rgba(240,165,0,0.1)';
  };

  const getTextColor = () => {
    if (type === 'success') return theme === 'dark' ? '#7fdf9f' : colors.accent;
    if (type === 'error') return theme === 'dark' ? '#FFB3B3' : colors.danger;
    return colors.warning;
  };

  const getBorderColor = () => {
    if (type === 'success') return colors.accent || '#36E27B';
    if (type === 'error') return colors.danger || '#e04848';
    return colors.warning || '#f0a500';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 20px',
        backgroundColor: getBgColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '8px',
        color: getTextColor(),
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        maxWidth: '400px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: getTextColor(),
          cursor: 'pointer',
          fontSize: '18px',
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};


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
  settingsSummary: {
  marginTop: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  maxWidth: 420,
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
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [firewallRules, setFirewallRules] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingProfile, setSharingProfile] = useState(null);
  const [showShareManagement, setShowShareManagement] = useState(false);



const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const fetchFirewallRules = useCallback(async () => {
    const res = await api.get('/firewall');
    setFirewallRules(res.data.data || []);
  }, []);



useEffect(() => {
  fetchProfiles();
  fetchLogs();
  fetchFirewallRules();
  const handleClickOutside = (e) => {
    if (!e.target.closest('.country-input-container')) {
      setShowCountrySuggestions(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [fetchFirewallRules]);



  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setConfirmModal({
        message,
        onConfirm: () => {
          setConfirmModal(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(null);
          resolve(false);
        },
      });
    });
  };

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
    firewallRules: [],

    // Scheduling
    isScheduled: false,
    scheduleType: 'NONE',
    scheduleStartTime: '',
    scheduleEndTime: '',
    scheduleDays: [],
    scheduleCondition: '',
    autoActivate: false,

    geoLocationCountries: [], 
  });
    const selectedFirewallRules = firewallRules.filter(rule =>
      formData.firewallRules.includes(rule.id)
    );

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

        firewallRules: formData.firewallRules,

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
        showToast('Profile updated successfully!','success');
      } else {
        await api.post(`/profiles`, submitData);
        showToast('Profile created successfully!', 'success');
      }

      setShowForm(false);
      setEditingProfile(null);
      resetForm();
      fetchProfiles();
      fetchLogs();
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast(
        'Error saving profile: ' +
        (error.response?.data?.message || error.message),
        'error'
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
        ? profile.firewallRules.map(r =>
            typeof r === 'string' ? r : r.id
          )
        : [],


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

      geoLocationCountries: profile.geoLocationCountries || [],
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to deactivate this profile?');
    if (confirmed) {
      try {
        await api.put(`/profiles/${id}/deactivate`, {});
        showToast('Profile deactivated successfully!');
        fetchProfiles();
        fetchLogs();
      } catch (error) {
        console.error('Error deactivating profile:', error);
        showToast('Error deactivating profile', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this profile?');
    if (confirmed) {
      try {
        await api.delete(`/profiles/${id}`);
        showToast('Profile deleted successfully!', 'success');
        fetchProfiles();
        fetchLogs();
      } catch (error) {
        console.error('Error deleting profile:', error);
        showToast('Error deleting profile', 'error');
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`/profiles/${id}/activate`, {});
      showToast('Profile activated successfully!', 'success');
      fetchProfiles();
      fetchLogs();
    } catch (error) {
      console.error('Error activating profile:', error);
      showToast('Error activating profile', 'error');
    }
  };

const [countryInputValue, setCountryInputValue] = useState('');
const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);

const getAllCountryNames = () => {
  const countryObj = countries.getNames("en", { select: "official" });
  return Object.values(countryObj).sort();
};

const getFilteredCountries = () => {
  if (!countryInputValue) return [];
  const allCountries = getAllCountryNames();
  return allCountries.filter(country =>
    country.toLowerCase().includes(countryInputValue.toLowerCase())
  ).slice(0, 10);
};

const handleAddCountry = (country) => {
  const trimmedCountry = country.trim();
  if (trimmedCountry && !formData.geoLocationCountries.includes(trimmedCountry)) {
    setFormData({
      ...formData,
      geoLocationCountries: [...formData.geoLocationCountries, trimmedCountry],
    });
    setCountryInputValue('');
    setShowCountrySuggestions(false);
  }
};

const handleRemoveCountry = (countryToRemove) => {
  setFormData({
    ...formData,
    geoLocationCountries: formData.geoLocationCountries.filter(c => c !== countryToRemove),
  });
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
      firewallRules: [],
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
      geoLocationCountries: [],
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
      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
          colors={colors}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          colors={colors}
          theme={theme}
        />
      )}


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

         <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowShareManagement(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Manage All Shares
          </button>
                    
          <button
            onClick={() => setShowLogs(!showLogs)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: showLogs ? colors.accentSoft : 'transparent',
              color: colors.text,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
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
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span className="log-date" style={styles.logDate}>
                      {formatDate(log.createdAt)}
                    </span>

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
                            ? 'rgba(249,115,22,0.12)'
                            : colors.accentSoft,
                        color:
                          log.action === 'DEACTIVATED'
                            ? '#f97316'
                            : colors.accent,
                      }}
                    >
                      {log.action}
                    </span>
                  </div>

                  <div className="log-card-body">
                    <p>
                      <span className="log-label">Profile:</span>{' '}
                      <span
                        className={`log-profile ${!log.profile?.name ? 'deleted' : ''
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

            {/* Firewall Rules Selection */}
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
                Firewall Rules
              </h4>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: colors.text, fontWeight: 500 }}>
                  Select Firewall Rule Set to Apply
                </label>
                <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>
                  Choose one firewall rule configuration for this profile
                </p>
                
                {firewallRules.length === 0 ? (
                  <p style={{ color: colors.textMuted, fontSize: 13 }}>
                    No firewall rules available. Create rules in the Firewall Management section first.
                  </p>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 10,
                    maxHeight: 300,
                    overflowY: 'auto',
                    padding: 4
                  }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: 12,
                        borderRadius: 8,
                        border: `2px solid ${formData.firewallRules.length === 0 ? colors.accent : colors.border}`,
                        backgroundColor: formData.firewallRules.length === 0
                          ? (theme === 'dark' ? 'rgba(54,226,123,0.08)' : colors.accentSoft)
                          : colors.bgPanel,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (formData.firewallRules.length !== 0) {
                          e.currentTarget.style.borderColor = colors.textMuted;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.firewallRules.length !== 0) {
                          e.currentTarget.style.borderColor = colors.border;
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="firewallRuleSelection"
                        checked={formData.firewallRules.length === 0}
                        onChange={() => {
                          setFormData({
                            ...formData,
                            firewallRules: []
                          });
                        }}
                        style={{
                          marginTop: 2,
                          cursor: 'pointer',
                          width: 16,
                          height: 16,
                          accentColor: colors.accent
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 700, 
                          color: colors.text,
                          marginBottom: 4
                        }}>
                          No Firewall Rule (Default)
                        </div>
                        <div style={{ fontSize: 12, color: colors.textMuted }}>
                          Use system default firewall settings only
                        </div>
                      </div>
                    </label>
                    
                    {firewallRules.map((rule, index) => {
                      const isSelected = formData.firewallRules.includes(rule.id);
                      return (
                        <label
                          key={rule.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: 12,
                            borderRadius: 8,
                            border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                            backgroundColor: isSelected 
                              ? (theme === 'dark' ? 'rgba(54,226,123,0.08)' : colors.accentSoft)
                              : colors.bgPanel,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = colors.textMuted;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = colors.border;
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="firewallRuleSelection"
                            checked={isSelected}
                            onChange={() => {
                              setFormData({
                                ...formData,
                                firewallRules: [rule.id]
                              });
                            }}
                            style={{
                              marginTop: 2,
                              cursor: 'pointer',
                              width: 16,
                              height: 16,
                              accentColor: colors.accent
                            }}
                          />
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: colors.text,
                                }}
                              >
                                Firewall Rule {index + 1}
                              </span>
                              
                              <span
                                style={{
                                  fontSize: 10,
                                  color: colors.textMuted,
                                  fontFamily: 'monospace',
                                  opacity: 0.6
                                }}
                              >
                                
                              </span>
                              
                              <span
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: 12,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  backgroundColor: rule.action === 'allow'
                                    ? (theme === 'dark' ? '#1E402C' : '#e6f4ed')
                                    : (theme === 'dark' ? '#40201E' : '#fee2e2'),
                                  color: rule.action === 'allow'
                                    ? (theme === 'dark' ? '#36E27B' : '#1fa45a')
                                    : (theme === 'dark' ? '#FF7777' : '#d4183d'),
                                }}
                              >
                                {rule.action === 'allow' ? '✓' : '✗'} {rule.action.toUpperCase()}
                              </span>
                              
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 12,
                                  fontSize: 11,
                                  backgroundColor: theme === 'light' ? '#f1f3f5' : '#2a2a2a',
                                  color: colors.textMuted,
                                  fontWeight: 500
                                }}
                              >
                                {(rule.protocol || 'any').toUpperCase()}
                              </span>
                              
                              <span style={{ fontSize: 11, color: colors.textMuted }}>
                                {rule.direction.toUpperCase()}
                              </span>
                            </div>

                            <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>
                              <strong>Source:</strong> {rule.sourceIP || 'Any'}:{rule.sourcePort || 'Any'}
                            </div>

                            <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>
                              <strong>Destination:</strong> {rule.destinationIP || 'Any'}:{rule.destinationPort || 'Any'}
                            </div>

                            {rule.description && (
                              <div
                                style={{
                                  fontSize: 12,
                                  fontStyle: 'italic',
                                  color: colors.textMuted,
                                  marginTop: 6,
                                }}
                              >
                                "{rule.description}"
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Rule Summary */}
              {selectedFirewallRules.length > 0 && (
                <div style={{ 
                  marginTop: 16, 
                  padding: 12, 
                  backgroundColor: colors.bgCard,
                  borderRadius: 8,
                  border: `1px solid ${colors.accent}`
                }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: colors.text,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>✓</span> Selected Rule
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>
                    {selectedFirewallRules.map((rule) => {
                      const ruleIndex = firewallRules.findIndex(r => r.id === rule.id);
                      return (
                        <div key={rule.id} style={{ 
                          padding: 8,
                          backgroundColor: colors.bgPanel,
                          borderRadius: 6,
                          border: `1px solid ${colors.border}`
                        }}>
                          <div style={{ fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                            Firewall Rule {ruleIndex + 1}
                          </div>
                          <div>
                            {rule.action.toUpperCase()} - {rule.protocol.toUpperCase()} ({rule.direction})
                            {rule.description && ` - ${rule.description}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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


              {/* Scheduling Section */}
                {formData.isScheduled && (
                  <div className="nested-fields" style={{ marginTop: 16 }}>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: 8, 
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: 500
                      }}>
                        Schedule Type
                      </label>
                      <select
                        name="scheduleType"
                        value={formData.scheduleType}
                        onChange={handleInputChange}
                        className="form-select"
                        style={styles.select}
                      >
                        <option value="NONE">None</option>
                        <option value="TIME">Time-Based</option>
                        <option value="CONDITION">Condition-Based (Geolocation)</option>
                        <option value="BOTH">Time + Geolocation</option>
                      </select>
                    </div>

                    {/* Time-Based Settings */}
                    {(formData.scheduleType === 'TIME' || formData.scheduleType === 'BOTH') && (
                      <div style={{ 
                        backgroundColor: colors.bgPanel,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 16
                      }}>
                        <h5 style={{ 
                          margin: '0 0 16px 0', 
                          color: colors.text,
                          fontSize: 15,
                          fontWeight: 600
                        }}>
                          Time-Based Settings
                        </h5>

                        <div className="form-group" style={{ marginBottom: 16 }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: 6, 
                            color: colors.text,
                            fontSize: 13
                          }}>
                            Start Time
                          </label>
                          <input
                            type="time"
                            name="scheduleStartTime"
                            value={formData.scheduleStartTime}
                            onChange={handleInputChange}
                            className="form-input"
                            style={styles.formInput}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 16 }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: 6, 
                            color: colors.text,
                            fontSize: 13
                          }}>
                            End Time
                          </label>
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
                          <label style={{ 
                            display: 'block', 
                            marginBottom: 10, 
                            color: colors.text,
                            fontSize: 13,
                            fontWeight: 500
                          }}>
                            Active Days
                          </label>
                          <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                            gap: 8
                          }}>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                              <label 
                                key={day} 
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '8px 10px',
                                  backgroundColor: formData.scheduleDays?.includes(day) 
                                    ? colors.accentSoft 
                                    : 'transparent',
                                  border: `1px solid ${formData.scheduleDays?.includes(day) 
                                    ? colors.accent 
                                    : colors.border}`,
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  fontSize: 13,
                                  color: colors.text,
                                  transition: 'all 0.2s'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.scheduleDays?.includes(day)}
                                  onChange={() => handleDayToggle(day)}
                                  style={{ cursor: 'pointer' }}
                                />
                                <span>{day.slice(0, 3)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Geolocation-Based Activation - COMPLETE SECTION */}
                    {(formData.scheduleType === 'CONDITION' || formData.scheduleType === 'BOTH') && (
                      <div style={{ marginTop: 20 }}>
                        <h4 style={{
                          marginTop: 0,
                          marginBottom: 12,
                          color: colors.text,
                          fontSize: 16,
                          fontWeight: 600
                        }}>
                          Geolocation-Based Activation
                        </h4>
                        
                        {/* Country Input with Autocomplete */}
                        <div className="country-input-container" style={{ 
                          position: 'relative', 
                          marginBottom: 16 
                        }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                              <input
                                type="text"
                                value={countryInputValue}
                                onChange={(e) => {
                                  setCountryInputValue(e.target.value);
                                  setShowCountrySuggestions(true);
                                }}
                                onFocus={() => setShowCountrySuggestions(true)}
                                placeholder="Type country name (e.g., United States, Bangladesh)"
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  backgroundColor: colors.inputBg,
                                  border: `1px solid ${colors.inputBorder}`,
                                  borderRadius: 8,
                                  fontSize: 14,
                                  color: colors.text,
                                  outline: 'none'
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (countryInputValue.trim()) {
                                      handleAddCountry(countryInputValue);
                                    }
                                  }
                                }}
                              />
                              
                              {/* Autocomplete Dropdown */}
                              {showCountrySuggestions && countryInputValue && getFilteredCountries().length > 0 && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  right: 0,
                                  maxHeight: 250,
                                  overflowY: 'auto',
                                  backgroundColor: colors.bgCard,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: 8,
                                  marginTop: 4,
                                  zIndex: 1000,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}>
                                  {getFilteredCountries().map((country, index) => (
                                    <div
                                      key={index}
                                      onClick={() => handleAddCountry(country)}
                                      style={{
                                        padding: '12px 14px',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        color: colors.text,
                                        borderBottom: index < getFilteredCountries().length - 1 ? `1px solid ${colors.border}` : 'none',
                                        transition: 'background-color 0.15s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = colors.accentSoft;
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      <span style={{ fontSize: 16 }}></span>
                                      <span>{country}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                if (countryInputValue.trim()) {
                                  handleAddCountry(countryInputValue);
                                }
                              }}
                              style={{
                                padding: '10px 18px',
                                borderRadius: 8,
                                border: 'none',
                                backgroundColor: colors.accent,
                                color: theme === 'dark' ? '#121212' : '#ffffff',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                              Add Country
                            </button>
                          </div>
                        </div>
                        
                        {/* Selected Countries Display */}
                        {formData.geoLocationCountries && formData.geoLocationCountries.length > 0 && (
                          <div style={{
                            backgroundColor: colors.bgPanel,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 8,
                            padding: 16,
                            marginTop: 12
                          }}>
                            <div style={{ 
                              fontSize: 13, 
                              color: colors.textMuted, 
                              marginBottom: 12,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <span>✓</span>
                              <span>Active in these countries ({formData.geoLocationCountries.length}):</span>
                            </div>
                            
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 10 
                            }}>
                              {formData.geoLocationCountries.map((country, index) => (
                                <div
                                  key={index}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 14px',
                                    backgroundColor: colors.accentSoft,
                                    border: `1px solid ${colors.accent}`,
                                    borderRadius: 20,
                                    fontSize: 14,
                                    color: colors.text,
                                    fontWeight: 500
                                  }}
                                >
                                  <span>{country}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCountry(country)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: colors.danger,
                                      cursor: 'pointer',
                                      fontSize: 18,
                                      lineHeight: 1,
                                      padding: '0 2px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      fontWeight: 'bold',
                                      transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    title={`Remove ${country}`}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="autoActivate"
                      checked={formData.autoActivate}
                      onChange={handleInputChange}
                    />
                    <span>  Auto-activate when conditions are met</span>
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
                className={`profile-card ${profile.isActive ? 'active-profile' : ''
                  }`}
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: 12,
                  border: `1px solid ${profile.isActive ? colors.accent : colors.border
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
                    position: 'relative',
                    minHeight: '200px',
                  }}
                >
                  {/* LEFT: info */}
                  <div
                    className="profile-info"
                    style={{ maxWidth: 520 }}
                  >
                    <div
                      className="profile-title"
                      style={{
                        marginBottom: 12,
                      }}
                    >
                      {/* Name on its own line */}
                      <h4
                        style={{
                          margin: 0,
                          color: colors.text,
                          fontSize: 18,
                          fontWeight: 600,
                          marginBottom: 8,
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
                            borderRadius: 4,
                            fontSize: 11,
                            backgroundColor: 'transparent',
                            color: colors.accent,
                            fontWeight: 500,
                            border: `1px solid ${colors.accent}`,
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
                          marginBottom: 16,
                          margin: 0,
                        }}
                      >
                        {profile.description}
                      </p>
                    )}

                    {/* Settings Summary */}
                    <div
                      className="settings-summary"
                      style={{
                        marginTop: 14,
                        paddingLeft: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        maxWidth: 420,
                      }}


                    >
                      <div 
                        className="setting-item" 
                        style={{ 
                          display: 'grid',
                          gridTemplateColumns: '100px auto',
                          alignItems: 'center',
                          gap: '8px',
                        }}

                      >
                        <strong
                          style={{
                            color: colors.textMuted,
                            fontWeight: 600,
                          }}
                        >
                          VPN:
                        </strong>

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

                      <div 
                        className="setting-item" 
                        style={{ 
                          display: 'grid',
                          gridTemplateColumns: '120px auto',
                          alignItems: 'center',
                          gap: '8px',
                        }}

                      >
                        <strong style={{ color: colors.textMuted, fontWeight: 600 }}>
                          Firewall:
                        </strong>

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

                      <div 
                        className="setting-item"
                        style={{ 
                          display: 'grid',
                          gridTemplateColumns: '120px auto',
                          alignItems: 'center',
                          gap: '8px',
                        }}

                      >
                        <strong style={{ color: colors.textMuted, fontWeight: 600 }}>
                          Scheduling:
                        </strong>

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
                        marginTop: 16,
                      }}
                    >
                      <p style={{ margin: '4px 0' }}>Created: {formatDate(profile.createdAt)}</p>
                      {profile.lastActivatedAt && (
                        <p style={{ margin: '4px 0' }}>
                          Last Activated:{' '}
                          {formatDate(profile.lastActivatedAt)} ({profile.activationCount} times)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: actions - positioned lower */}
                  <div
                    className="profile-actions"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 8,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                      marginTop: '40px',
                      minWidth: 300,
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

                  {/* Share Profile button - positioned at bottom right corner */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '20px',
                      right: '20px',
                    }}
                  >
                    <button
                      onClick={() => {
                        setSharingProfile(profile);
                        setShowShareModal(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: palette.accent,
                        color: theme === 'dark' ? '#121212' : '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      Share Profile
                    </button>
                  </div>


                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        {showShareModal && (
        <ShareCreationModal
          profile={sharingProfile}
          onClose={() => {
            setShowShareModal(false);
            setSharingProfile(null);
          }}
          onSuccess={() => {
            showToast('Share link created successfully!', 'success');
          }}
          theme={theme}
          palette={colors}
        />
      )}

      {showShareManagement && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowShareManagement(false)}
        >
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              width: '90%',
              maxWidth: '1200px',
              height: '80%',
              maxHeight: '800px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0, color: colors.text }}>Share Management</h2>
              <button
                onClick={() => setShowShareManagement(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text,
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
              <ShareManagement theme={theme} palette={colors} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default ProfileManager;