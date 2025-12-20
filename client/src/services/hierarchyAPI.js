// src/services/hierarchyAPI.js
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

const API_URL = getApiUrl();

// Get auth token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const hierarchyAPI = {
    // ============================================
    // SUBSCRIPTION
    // ============================================

    getMySubscription: async () => {
        try {
            const response = await axios.get(`${API_URL}/hierarchy/subscription`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    upgradeToLeader: async (tier) => {
        try {
            const response = await axios.post(
                `${API_URL}/hierarchy/subscription/upgrade`,
                { tier },
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // ============================================
    // GROUPS (Leader)
    // ============================================

    createGroup: async (groupData) => {
        try {
            const response = await axios.post(
                `${API_URL}/hierarchy/groups`,
                groupData,
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getMyGroups: async () => {
        try {
            const response = await axios.get(`${API_URL}/hierarchy/groups/my-groups`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getGroupDetails: async (groupId) => {
        try {
            const response = await axios.get(`${API_URL}/hierarchy/groups/${groupId}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    updateGroup: async (groupId, groupData) => {
        try {
            const response = await axios.put(
                `${API_URL}/hierarchy/groups/${groupId}`,
                groupData,
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    deleteGroup: async (groupId) => {
        try {
            const response = await axios.delete(`${API_URL}/hierarchy/groups/${groupId}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // ============================================
    // INVITATIONS
    // ============================================

    inviteMember: async (groupId, email) => {
        try {
            const response = await axios.post(
                `${API_URL}/hierarchy/groups/${groupId}/invite`,
                { email },
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getMyInvitations: async () => {
        try {
            const response = await axios.get(`${API_URL}/hierarchy/invitations`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    acceptInvitation: async (invitationId) => {
        try {
            const response = await axios.post(
                `${API_URL}/hierarchy/invitations/${invitationId}/accept`,
                {},
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    rejectInvitation: async (invitationId) => {
        try {
            const response = await axios.post(
                `${API_URL}/hierarchy/invitations/${invitationId}/reject`,
                {},
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // ============================================
    // MEMBERSHIPS
    // ============================================

    getMyMemberships: async () => {
        try {
            const response = await axios.get(`${API_URL}/hierarchy/memberships`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    leaveGroup: async (membershipId) => {
        try {
            const response = await axios.post(
                `${API_URL}/hierarchy/memberships/${membershipId}/leave`,
                {},
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    getGroupMembers: async (groupId) => {
        try {
            const response = await axios.get(
                `${API_URL}/hierarchy/groups/${groupId}/members`,
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    removeMember: async (groupId, memberId) => {
        try {
            const response = await axios.delete(
                `${API_URL}/hierarchy/groups/${groupId}/members/${memberId}`,
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};