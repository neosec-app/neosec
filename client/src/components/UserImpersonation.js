import React, { useState, useEffect } from 'react';
import { impersonationAPI, adminAPI, getErrorMessage } from '../services/api';
import { FiUser, FiLogIn, FiLogOut, FiAlertCircle } from 'react-icons/fi';

const UserImpersonation = ({ theme = 'dark', palette = null }) => {
  const darkPalette = {
    bgMain: '#121212', bgCard: '#181818', text: '#ffffff', textMuted: '#9aa3b5',
    border: '#242424', accent: '#36E27B', warning: '#f0a500'
  };
  const lightPalette = {
    bgMain: '#f6f8fb', bgCard: '#ffffff', text: '#0b172a', textMuted: '#5b6b7a',
    border: '#d9e2ec', accent: '#1fa45a', warning: '#d97706'
  };
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchSessions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await impersonationAPI.getImpersonationSessions();
      if (response.success) {
        setSessions(response.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleStartImpersonation = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }
    try {
      const response = await impersonationAPI.startImpersonation(selectedUserId, reason);
      if (response.success) {
        // Store impersonation token and redirect
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.targetUser));
          window.location.reload();
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEndImpersonation = async (sessionId) => {
    try {
      const response = await impersonationAPI.endImpersonation(sessionId);
      if (response.success) {
        await fetchSessions();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: colors.bgMain, minHeight: '100vh', color: colors.text }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 700 }}>User Impersonation</h1>
      
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
          color: colors.danger,
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FiAlertCircle style={{ width: '16px', height: '16px' }} />
          {error}
        </div>
      )}

      <div style={{
        padding: '20px',
        backgroundColor: theme === 'light' ? '#fef3c7' : 'rgba(234, 179, 8, 0.2)',
        border: `1px solid ${colors.warning}`,
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: colors.text }}>
          <strong>Warning:</strong> Impersonation allows you to view the system as another user. All actions will be logged.
        </p>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Start Impersonation</h2>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Select User</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.text
            }}
          >
            <option value="">-- Select User --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.email}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Reason (Optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Debugging user issue, Validating permissions"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.text,
              minHeight: '80px'
            }}
          />
        </div>
        <button
          onClick={handleStartImpersonation}
          disabled={!selectedUserId}
          style={{
            padding: '12px 24px',
            backgroundColor: selectedUserId ? colors.accent : colors.border,
            color: selectedUserId ? (theme === 'dark' ? '#121212' : '#fff') : colors.textMuted,
            border: 'none',
            borderRadius: '8px',
            cursor: selectedUserId ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiLogIn style={{ width: '16px', height: '16px' }} />
          Start Impersonation
        </button>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px'
      }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Active Sessions</h2>
        {sessions.filter(s => s.isActive).length === 0 ? (
          <p style={{ color: colors.textMuted }}>No active impersonation sessions</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.filter(s => s.isActive).map(session => (
              <div key={session.id} style={{
                padding: '16px',
                backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>
                    {session.targetUser?.email}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                    Started: {new Date(session.startedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleEndImpersonation(session.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: colors.danger,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FiLogOut style={{ width: '14px', height: '14px' }} />
                  End Session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserImpersonation;

