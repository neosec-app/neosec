// client/src/services/vpnAPI.js
import axios from 'axios';

// Get API URL with smart fallback
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    let url = process.env.REACT_APP_API_URL.trim();
    if (!url.endsWith('/api')) {
      url = url.endsWith('/') ? url + 'api' : url + '/api';
    }
    return url;
  }
  
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isVercel || isProduction) {
    return 'https://neosec.onrender.com/api';
  }
  
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


const vpnAPI = {
  getConfigs: async () => {
    const res = await api.get('/vpn');
    return res.data;
  },

  getConfig: async (id) => {
    const res = await api.get(`/vpn/${id}`);
    return res.data;
  },

  createConfig: async (payload) => {
    const res = await api.post('/vpn', payload);
    return res.data;
  },

  updateConfig: async (id, payload) => {
    const res = await api.put(`/vpn/${id}`, payload);
    return res.data;
  },

  deleteConfig: async (id) => {
    const res = await api.delete(`/vpn/${id}`);
    return res.data;
  },

  toggleConfig: async (id) => {
    const res = await api.patch(`/vpn/${id}/toggle`);
    return res.data;
  },

  cloneConfig: async (id) => {
    const res = await api.post(`/vpn/${id}/clone`);
    return res.data;
  },

  downloadConfig: async (id) => {
    const res = await api.get(`/vpn/${id}/download`, {
      responseType: 'text'
    });
    return res.data;
  }
};

export default vpnAPI;