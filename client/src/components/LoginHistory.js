import React, { useState, useEffect, useCallback } from 'react';
import { loginHistoryAPI, getErrorMessage } from '../services/api';
import { FiLock, FiUnlock, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const LoginHistory = ({ theme = 'dark', palette = null, userId = null }) => {
  const darkPalette = {
    bgMain: '#121212', bgCard: '#181818', text: '#ffffff', textMuted: '#9aa3b5',
    border: '#242424', accent: '#36E27B', danger: '#e04848'
  };
  const lightPalette = {
    bgMain: '#f6f8fb', bgCard: '#ffffff', text: '#0b172a', textMuted: '#5b6b7a',
    border: '#d9e2ec', accent: '#1fa45a', danger: '#d4183d'
  };
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [history, setHistory] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'history') {
        const response = await loginHistoryAPI.getLoginHistory({ userId });
        if (response.success) {
          setHistory(response.data || []);
          setLastRefresh(new Date());
        }
      } else {
        const response = await loginHistoryAPI.getSecurityEvents(7);
        if (response.success) {
          setSecurityEvents(response.data || []);
          setLastRefresh(new Date());
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 60000); // 60 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleLockUser = async (targetUserId, locked) => {
    try {
      const response = await loginHistoryAPI.toggleUserLock(targetUserId, locked);
      if (response.success) {
        await fetchData();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: colors.bgMain, minHeight: '100vh', color: colors.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Login History & Security</h1>
        <div style={{ fontSize: '12px', color: colors.textMuted }}>
          Auto-refreshes every 60s • Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: `1px solid ${colors.border}`
      }}>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 20px',
            backgroundColor: 'transparent',
            color: activeTab === 'history' ? colors.accent : colors.textMuted,
            border: 'none',
            borderBottom: activeTab === 'history' ? `2px solid ${colors.accent}` : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'history' ? 600 : 500
          }}
        >
          Login History
        </button>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '12px 20px',
            backgroundColor: 'transparent',
            color: activeTab === 'security' ? colors.accent : colors.textMuted,
            border: 'none',
            borderBottom: activeTab === 'security' ? `2px solid ${colors.accent}` : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'security' ? 600 : 500
          }}
        >
          Security Events
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Loading...</div>
      ) : error ? (
        <div style={{
          padding: '12px',
          backgroundColor: theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
          color: colors.danger,
          borderRadius: '8px'
        }}>
          {error}
        </div>
      ) : (
        <div style={{
          padding: '20px',
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: colors.textMuted }}>Date/Time</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: colors.textMuted }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: colors.textMuted }}>IP Address</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: colors.textMuted }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: colors.textMuted }}>Location</th>
                {activeTab === 'security' && (
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: colors.textMuted }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'history' ? history : securityEvents).map((entry, index) => (
                <tr key={entry.id || index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: colors.text }}>
                    {entry.user?.email || 'Unknown User'}
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: colors.textMuted }}>
                    {entry.ipAddress}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      backgroundColor: entry.success
                        ? (theme === 'light' ? '#dcfce7' : 'rgba(34, 197, 94, 0.2)')
                        : (theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)'),
                      color: entry.success
                        ? (theme === 'light' ? '#16a34a' : '#4ade80')
                        : (theme === 'light' ? '#dc2626' : '#f87171')
                    }}>
                      {entry.success ? (
                        <FiCheckCircle style={{ width: '12px', height: '12px' }} />
                      ) : (
                        <FiAlertTriangle style={{ width: '12px', height: '12px' }} />
                      )}
                      {entry.success ? 'Success' : entry.failureReason || 'Failed'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: colors.textMuted }}>
                    {entry.location || 'Unknown'}
                  </td>
                  {activeTab === 'security' && entry.user && (
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleLockUser(entry.user.id, !entry.user.isApproved)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: entry.user.isApproved ? colors.danger : colors.accent,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {entry.user.isApproved ? <><FiLock /> Lock</> : <><FiUnlock /> Unlock</>}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LoginHistory;

