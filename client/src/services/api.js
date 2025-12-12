import axios from 'axios';

// Get API URL from environment variable or use default
// For production, use Render backend URL
// For development, use localhost
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    // Ensure it ends with /api
    let url = process.env.REACT_APP_API_URL.trim();
    if (!url.endsWith('/api')) {
      url = url.endsWith('/') ? url + 'api' : url + '/api';
    }
    return url;
  }

  if (process.env.NODE_ENV === 'production') {
    // Default production URL - update this with your actual Render backend URL
    return 'https://neosec.onrender.com/api';
  }

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
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
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
    const response = await api.post(`/vpn/${configId}/toggle`);
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

export default api;
