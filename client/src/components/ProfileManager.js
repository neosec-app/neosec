import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfileManager.css';
import api from '../services/api';

const ProfileManager = () => {
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
    autoActivate: false
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
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDayToggle = (day) => {
    const days = formData.scheduleDays || [];
    if (days.includes(day)) {
      setFormData({
        ...formData,
        scheduleDays: days.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        scheduleDays: [...days, day]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
    const submitData = {
      ...formData,

      vpnPort:
        formData.vpnPort && !isNaN(formData.vpnPort)
          ? parseInt(formData.vpnPort)
          : null,

      firewallRules: formData.firewallRules
        ? formData.firewallRules
            .split(',')
            .map(r => r.trim())
            .filter(r => r !== '')
        : [],

      allowedIps: formData.allowedIps
        ? formData.allowedIps
            .split(',')
            .map(ip => ip.trim())
            .filter(ip => ip !== '')
        : [],

      blockedIps: formData.blockedIps
        ? formData.blockedIps
            .split(',')
            .map(ip => ip.trim())
            .filter(ip => ip !== '')
        : [],

      allowedPorts: formData.allowedPorts
        ? formData.allowedPorts
            .split(',')
            .map(p => p.trim())
            .filter(p => p !== '' && !isNaN(p))
            .map(Number)
        : [],

      blockedPorts: formData.blockedPorts
        ? formData.blockedPorts
            .split(',')
            .map(p => p.trim())
            .filter(p => p !== '' && !isNaN(p))
            .map(Number)
        : []
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
      alert('Error saving profile: ' + (error.response?.data?.message || error.message));
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
      firewallRules: Array.isArray(profile.firewallRules) ? profile.firewallRules.join(', ') : '',
      
      dnsEnabled: profile.dnsEnabled,
      primaryDns: profile.primaryDns || '',
      secondaryDns: profile.secondaryDns || '',
      dnsSecurity: profile.dnsSecurity,
      
      allowedIps: Array.isArray(profile.allowedIps) ? profile.allowedIps.join(', ') : '',
      blockedIps: Array.isArray(profile.blockedIps) ? profile.blockedIps.join(', ') : '',
      allowedPorts: Array.isArray(profile.allowedPorts) ? profile.allowedPorts.join(', ') : '',
      blockedPorts: Array.isArray(profile.blockedPorts) ? profile.blockedPorts.join(', ') : '',
      
      isScheduled: profile.isScheduled,
      scheduleType: profile.scheduleType || 'NONE',
      scheduleStartTime: profile.scheduleStartTime || '',
      scheduleEndTime: profile.scheduleEndTime || '',
      scheduleDays: profile.scheduleDays || [],
      scheduleCondition: profile.scheduleCondition || '',
      autoActivate: profile.autoActivate
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
      autoActivate: false
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
    switch(action) {
      case 'CREATED': return 'badge-created';
      case 'UPDATED': return 'badge-updated';
      case 'DELETED': return 'badge-deleted';
      case 'ACTIVATED': return 'badge-activated';
      case 'DEACTIVATED': return 'badge-deactivated';
      default: return 'badge-default';
    }
  };

  if (loading) {
    return <div className="loading-container">Loading profiles...</div>;
  }

  return (
    <div className="profile-manager">
      {/* Header */}
      <div className="pm-header">
        <h2>Security Profile Management</h2>
        <div className="header-actions">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="btn btn-logs"
          >
            {showLogs ? 'Hide Logs' : 'View Activity Logs'}
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-create"
          >
            Create New Profile
          </button>
        </div>
      </div>

      {/* Activity Logs Section */}
      {showLogs && (
        <div className="logs-section">
          <h3>Activity Logs</h3>
          {logs.length === 0 ? (
            <p className="no-logs">No activity logs yet.</p>
          ) : (
            <div className="logs-container">
              {logs.map((log) => (
                <div key={log.id} className="log-card">
                  <div className="log-card-header">
                    <span className="log-date">{formatDate(log.createdAt)}</span>
                    <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="log-card-body">
                    <p>
                      <span className="log-label">Profile:</span>{' '}
                      <span className={`log-profile ${!log.profile?.name ? 'deleted' : ''}`}>
                        {log.profile?.name || (
                          log.description?.match(/"([^"]+)"/)?.[1] || "Deleted"
                        )}
                      </span>
                    </p>
                    <p>
                      <span className="log-label">User:</span>{' '}
                      <span className="log-email">{log.userEmail}</span>
                    </p>
                    {log.description && (
                      <p className="log-description">{log.description}</p>
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
        <div className="profile-form-container">
          <h3>{editingProfile ? 'Edit Profile' : 'Create New Profile'}</h3>
          <form onSubmit={handleSubmit} className="profile-form">
            
            {/* Basic Information */}
            <div className="form-section">
              <h4>Basic Information</h4>
              
              <div className="form-group">
                <label>Profile Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
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
                />
              </div>
            </div>

            {/* VPN Settings */}
            <div className="form-section">
              <h4>VPN Settings</h4>
              
              <label className="checkbox-label">
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
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Protocol</label>
                    <select
                      name="vpnProtocol"
                      value={formData.vpnProtocol}
                      onChange={handleInputChange}
                      className="form-select"
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
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Firewall Settings */}
            <div className="form-section">
              <h4>Firewall Settings</h4>
              
              <label className="checkbox-label">
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
                    >
                      <option value="ALLOW">Allow All (Blacklist Mode)</option>
                      <option value="DENY">Deny All (Whitelist Mode)</option>
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
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Access Control */}
            <div className="form-section">
              <h4>Access Control</h4>
              
              <div className="form-group">
                <label>Allowed IPs (comma-separated)</label>
                <input
                  type="text"
                  name="allowedIps"
                  placeholder="192.168.1.1, 10.0.0.1"
                  value={formData.allowedIps}
                  onChange={handleInputChange}
                  className="form-input"
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
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="form-section">
              <h4>Scheduling</h4>
              
              <label className="checkbox-label">
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
                    >
                      <option value="NONE">None</option>
                      <option value="TIME">Time-Based</option>
                      <option value="CONDITION">Condition-Based</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>
                  
                  {(formData.scheduleType === 'TIME' || formData.scheduleType === 'BOTH') && (
                    <>
                      <div className="form-group">
                        <label>Start Time</label>
                        <input
                          type="time"
                          name="scheduleStartTime"
                          value={formData.scheduleStartTime}
                          onChange={handleInputChange}
                          className="form-input"
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
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Active Days</label>
                        <div className="days-selector">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
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
                  
                  {(formData.scheduleType === 'CONDITION' || formData.scheduleType === 'BOTH') && (
                    <div className="form-group">
                      <label>Activation Condition</label>
                      <input
                        type="text"
                        name="scheduleCondition"
                        placeholder="e.g., WiFi network name, IP range"
                        value={formData.scheduleCondition}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                      <small className="field-hint">
                        Example: "Public WiFi", "192.168.1.x", "Outside office hours"
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
            <div className="form-actions">
              <button type="submit" className="btn btn-submit">
                {editingProfile ? 'Update Profile' : 'Create Profile'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profiles List */}
      <div className="profiles-section">
        <h3>Your Profiles ({profiles.length})</h3>
        {profiles.length === 0 ? (
          <div className="empty-state">
            <p>No profiles yet. Create your first security profile!</p>
          </div>
        ) : (
          <div className="profiles-grid">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`profile-card ${profile.isActive ? 'active-profile' : ''}`}
              >
                <div className="profile-content">
                  <div className="profile-info">
                    <div className="profile-title">
                      <h4>{profile.name}</h4>
                      <div className="profile-badges">
                        {profile.isActive && (
                          <span className="badge badge-active">● ACTIVE</span>
                        )}
                        <span className="badge badge-type">{profile.profileType}</span>
                      </div>
                    </div>
                    
                    {profile.description && (
                      <p className="profile-description">{profile.description}</p>
                    )}
                    
                    {/* Settings Summary */}
                    <div className="settings-summary">
                      <div className="setting-item">
                        <strong>VPN:</strong>
                        {profile.vpnEnabled ? (
                          <span className="status-enabled">
                            ✓ Enabled ({profile.vpnProtocol})
                          </span>
                        ) : (
                          <span className="status-disabled">✗ Disabled</span>
                        )}
                      </div>
                      
                      <div className="setting-item">
                        <strong>Firewall:</strong>
                        {profile.firewallEnabled ? (
                          <span className="status-enabled">
                            ✓ Enabled ({profile.defaultFirewallAction})
                          </span>
                        ) : (
                          <span className="status-disabled">✗ Disabled</span>
                        )}
                      </div>                     
                      
                      <div className="setting-item">
                        <strong>Scheduling:</strong>
                        {profile.isScheduled ? (
                          <span className="status-enabled">✓ {profile.scheduleType}</span>
                        ) : (
                          <span className="status-disabled">✗ None</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="profile-meta">
                      <p>Created: {formatDate(profile.createdAt)}</p>
                      {profile.lastActivatedAt && (
                        <p>
                          Last Activated: {formatDate(profile.lastActivatedAt)} 
                          ({profile.activationCount} times)
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="profile-actions">
                    {!profile.isActive ? (
                      <button
                        onClick={() => handleActivate(profile.id)}
                        className="btn btn-activate"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivate(profile.id)}
                        className="btn btn-deactivate"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(profile)}
                      className="btn btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="btn btn-delete"
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