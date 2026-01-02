import axios from 'axios';

// Get API URL from environment variable or use default
// For production, use Render backend URL
// For development, use localhost
const getApiUrl = () => {
  // Priority 1: Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    // Ensure it ends with /api
    let url = process.env.REACT_APP_API_URL.trim();
    if (!url.endsWith('/api')) {
      url = url.endsWith('/') ? url + 'api' : url + '/api';
    }
    return url;
  }

  // Priority 2: Check if we're on Vercel (production deployment)
  const isVercel = window.location.hostname.includes('vercel.app');
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isVercel || isProduction) {
    // Default production URL - update this with your actual Render backend URL
    return 'https://neosec-0vzg.onrender.com/api';
  }

  // Priority 3: Development - use localhost
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect for non-subscription endpoints
      const url = error.config?.url || '';
      if (!url.includes('/subscription/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      // For subscription endpoints, let the component handle the 401 error
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register a new user
  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// Dashboard API functions
export const dashboardAPI = {
  // Get dashboard data (VPN status and threats blocked)
  getDashboard: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  }
};
export const API_BASE = process.env.REACT_APP_API_URL;


// Admin API functions
export const adminAPI = {
  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Get admin statistics
  getStatistics: async () => {
    const response = await api.get('/admin/statistics');
    return response.data;
  }
};


// Scan API (VirusTotal)

export const scanAPI = {
  // Submit a URL for scanning
  scanUrl: async (url) => {
    const response = await api.post('/scan/url', { url });
    return response.data;
  },

  // Get scan status
  getStatus: async (scanId) => {
    const response = await api.get(`/scan/status/${scanId}`);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/scan/history');
    return response.data;
  }
};

// Firewall API functions
export const firewallAPI = {
  // Get all firewall rules for the current user
  getRules: async () => {
    const response = await api.get('/firewall');
    return response.data;
  },

  // Create a new firewall rule
  createRule: async (rule) => {
    const response = await api.post('/firewall', rule);
    return response.data;
  },

  // Update an existing firewall rule
  updateRule: async (id, rule) => {
    const response = await api.put(`/firewall/${id}`, rule);
    return response.data;
  },

  // Delete a firewall rule
  deleteRule: async (id) => {
    const response = await api.delete(`/firewall/${id}`);
    return response.data;
  }
};

// VPN API functions
export const vpnAPI = {
  // Toggle VPN configuration (connect/disconnect)
  toggleVpnConfig: async (configId) => {
    const response = await api.patch(`/vpn/${configId}/toggle`);
    return response.data;
  }
};

// Profile API functions
export const profilesAPI = {
  // Get all profiles
  getProfiles: async () => {
    const response = await api.get('/profiles');
    return response.data;
  },

  // Get all profile logs
  getLogs: async () => {
    const response = await api.get('/profiles/logs/all');
    return response.data;
  },

  // Create a new profile
  createProfile: async (profileData) => {
    const response = await api.post('/profiles', profileData);
    return response.data;
  },

  // Update a profile
  updateProfile: async (profileId, profileData) => {
    const response = await api.put(`/profiles/${profileId}`, profileData);
    return response.data;
  },

  // Delete a profile
  deleteProfile: async (profileId) => {
    const response = await api.delete(`/profiles/${profileId}`);
    return response.data;
  },

  // Activate a profile
  activateProfile: async (profileId) => {
    const response = await api.put(`/profiles/${profileId}/activate`, {});
    return response.data;
  },

  // Deactivate a profile
  deactivateProfile: async (profileId) => {
    const response = await api.put(`/profiles/${profileId}/deactivate`, {});
    return response.data;
  }
};

// Helper function to check if error is a connection error
export const isConnectionError = (error) => {
  if (!error) return false;

  // Check for network errors
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
    return true;
  }

  // Check for connection refused in message
  if (error.message && (
    error.message.includes('ERR_CONNECTION_REFUSED') ||
    error.message.includes('Network Error') ||
    error.message.includes('Failed to fetch')
  )) {
    return true;
  }

  // Check axios specific errors
  if (error.response === undefined && error.request) {
    return true;
  }

  return false;
};

// Helper function to get user-friendly error message
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (isConnectionError(error)) {
    return 'Cannot connect to server. Please make sure the backend server is running on port 5000.';
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};

// Audit Trail API functions
export const auditAPI = {
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit', { params });
    return response.data;
  },
  exportAuditLogs: async (data) => {
    const response = await api.post('/audit/export', data, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// System Health API functions
export const systemHealthAPI = {
  getSystemHealth: async () => {
    const response = await api.get('/system-health/health');
    return response.data;
  },
  getAPIPerformance: async (timeRange = '24h') => {
    const response = await api.get('/system-health/api-performance', { params: { timeRange } });
    return response.data;
  },
  getServerResources: async (timeRange = '24h') => {
    const response = await api.get('/system-health/server-resources', { params: { timeRange } });
    return response.data;
  },
  getVPNUptime: async () => {
    const response = await api.get('/system-health/vpn-uptime');
    return response.data;
  },
  getFirewallSyncData: async (days = 7) => {
    const response = await api.get('/system-health/firewall-sync', { params: { days } });
    return response.data;
  }
};

// Device API functions
export const deviceAPI = {
  getAllDevices: async (params = {}) => {
    const response = await api.get('/devices/all', { params });
    return response.data;
  },
  getUserDevices: async (userId) => {
    const response = await api.get(`/devices/user/${userId}`);
    return response.data;
  },
  registerDevice: async (deviceData) => {
    const response = await api.post('/devices/register', deviceData);
    return response.data;
  },
  updateDeviceStatus: async (deviceId, statusData) => {
    const response = await api.put(`/devices/${deviceId}/status`, statusData);
    return response.data;
  }
};

// Threat Blocker API functions
export const threatBlockerAPI = {
  getStatus: async () => {
    const response = await api.get('/threat-blocker/status');
    return response.data;
  },
  getBlocklist: async (params = {}) => {
    const response = await api.get('/threat-blocker/blocklist', { params });
    return response.data;
  },
  forceUpdate: async () => {
    const response = await api.post('/threat-blocker/force-update');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/threat-blocker/stats');
    return response.data;
  },
  updateSettings: async (settings) => {
    const response = await api.put('/threat-blocker/settings', settings);
    return response.data;
  },
  exportBlocklist: async (format = 'csv') => {
    const response = await api.get('/threat-blocker/export', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  }
};

// Activity Log API functions
export const activityLogAPI = {
  getLogs: async (params = {}) => {
    const response = await api.get('/activity-logs', { params });
    return response.data;
  },
  getLogById: async (id) => {
    const response = await api.get(`/activity-logs/${id}`);
    return response.data;
  },
  exportLogs: async (params = {}, format = 'csv') => {
    const response = await api.post('/activity-logs/export', params, {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  }
};

// Notification API extensions
export const notificationAPI = {
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },
  markAllAsRead: async (userId = null) => {
    const response = await api.patch('/notifications/mark-all-read', userId ? { userId } : {});
    return response.data;
  },
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/notifications/stats');
    return response.data;
  }
};

// Login History API functions
export const loginHistoryAPI = {
  getLoginHistory: async (params = {}) => {
    const response = await api.get('/login-history', { params });
    return response.data;
  },
  getSecurityEvents: async (days = 7) => {
    const response = await api.get('/login-history/security-events', { params: { days } });
    return response.data;
  },
  toggleUserLock: async (userId, locked) => {
    const response = await api.put(`/login-history/user/${userId}/lock`, { locked });
    return response.data;
  }
};

// Feature Toggle API functions
export const featureToggleAPI = {
  getFeatureToggles: async () => {
    const response = await api.get('/feature-toggles');
    return response.data;
  },
  checkFeatureAccess: async (featureName) => {
    const response = await api.get(`/feature-toggles/check/${featureName}`);
    return response.data;
  },
  setFeatureToggle: async (toggleData) => {
    const response = await api.post('/feature-toggles', toggleData);
    return response.data;
  },
  deleteFeatureToggle: async (id) => {
    const response = await api.delete(`/feature-toggles/${id}`);
    return response.data;
  }
};

// Role Template API functions
export const roleTemplateAPI = {
  getRoleTemplates: async () => {
    const response = await api.get('/role-templates');
    return response.data;
  },
  getRoleTemplate: async (id) => {
    const response = await api.get(`/role-templates/${id}`);
    return response.data;
  },
  createRoleTemplate: async (templateData) => {
    const response = await api.post('/role-templates', templateData);
    return response.data;
  },
  updateRoleTemplate: async (id, templateData) => {
    const response = await api.put(`/role-templates/${id}`, templateData);
    return response.data;
  },
  deleteRoleTemplate: async (id) => {
    const response = await api.delete(`/role-templates/${id}`);
    return response.data;
  }
};

// MFA API functions
export const mfaAPI = {
  getMFASettings: async (userId = null) => {
    const url = userId ? `/mfa/${userId}` : '/mfa';
    const response = await api.get(url);
    return response.data;
  },
  setupMFA: async (method = 'authenticator_app') => {
    const response = await api.post('/mfa/setup', { method });
    return response.data;
  },
  verifyMFA: async (token) => {
    const response = await api.post('/mfa/verify', { token });
    return response.data;
  },
  disableMFA: async () => {
    const response = await api.post('/mfa/disable');
    return response.data;
  }
};

// Impersonation API functions
export const impersonationAPI = {
  startImpersonation: async (targetUserId, reason = null) => {
    const response = await api.post('/impersonation/start', { targetUserId, reason });
    return response.data;
  },
  endImpersonation: async (sessionId) => {
    const response = await api.post(`/impersonation/end/${sessionId}`);
    return response.data;
  },
  getImpersonationSessions: async (activeOnly = false) => {
    const response = await api.get('/impersonation/sessions', { params: { activeOnly } });
    return response.data;
  }
};

export default api;
