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

  // Get scan history
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

export const fetchScanHistory = async () => {
  const token = localStorage.getItem('token');
  const res = await api.get('/scan/history', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};


export default api;
