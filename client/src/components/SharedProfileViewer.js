import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

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

const Toast = ({ message, type, onClose, colors, theme = 'dark' }) => {
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
    </div>
  );
};

const SharedProfileViewer = ({ token: propToken, theme = 'dark', palette: propPalette }) => {
  const token = propToken || window.location.pathname.split('/shared-profiles/')[1]?.split('?')[0];
  const colors = propPalette || (theme === 'light' ? lightPalette : darkPalette);

  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [importing, setImporting] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const fetchSharedProfile = useCallback(
    async (passwordAttempt = '') => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = passwordAttempt
          ? `/auth/shared-profiles/${token}?password=${encodeURIComponent(passwordAttempt)}`
          : `/auth/shared-profiles/${token}`;

        const res = await api.get(apiUrl);

        if (res.data.success) {
          setProfile(res.data.data.profile);
          setShareInfo(res.data.data.shareInfo);
          setRequiresPassword(false);
        }
      } catch (err) {
        if (err.response?.data?.requiresPassword) {
          setRequiresPassword(true);
        } else {
          setError(err.response?.data?.message || 'Failed to load shared profile');
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      fetchSharedProfile();
    } else {
      setError('Invalid share link');
      setLoading(false);
    }
  }, [fetchSharedProfile, token]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      fetchSharedProfile(password);
    }
  };

  const handleImport = async () => {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
      showToast('Please log in to import this profile', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    try {
      setImporting(true);
      const response = await api.post(`/auth/shared-profiles/${token}/import`, {
        password: password || undefined
      });
      
      if (response.data.success) {
        showToast('Profile imported successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/profiles';
        }, 2000);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to import profile', 'error');
    } finally {
      setImporting(false);
    }
  };

  const goToHome = () => {
    const authToken = localStorage.getItem('token');
    window.location.href = authToken ? '/dashboard' : '/login';
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.bgMain,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: `4px solid ${colors.border}`,
              borderTop: `4px solid ${colors.accent}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: colors.textMuted }}>Loading shared profile...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.bgMain,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            maxWidth: 500,
            width: '100%',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.danger}`,
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ margin: '0 0 12px 0', color: colors.text }}>Access Denied</h2>
          <p style={{ color: colors.textMuted, marginBottom: 24 }}>{error}</p>
          <button
            onClick={goToHome}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: colors.accent,
              color: theme === 'dark' ? '#121212' : '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (requiresPassword && !profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: colors.bgMain,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            colors={colors}
            theme={theme}
          />
        )}

        <div
          style={{
            maxWidth: 400,
            width: '100%',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 32,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h2 style={{ margin: 0, color: colors.text }}>Password Required</h2>
            <p style={{ color: colors.textMuted, marginTop: 8, fontSize: 14 }}>
              This profile is password protected
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: 12,
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: 8,
                fontSize: 14,
                color: colors.text,
                marginBottom: 16,
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: colors.accent,
                color: theme === 'dark' ? '#121212' : '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Unlock Profile
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgMain, padding: 20 }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          colors={colors}
          theme={theme}
        />
      )}

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 32 }}></span>
            <div>
              <h1 style={{ margin: 0, color: colors.text, fontSize: 24 }}>Shared Security Profile</h1>
              <p style={{ margin: '4px 0 0 0', color: colors.textMuted, fontSize: 14 }}>
                Shared by {shareInfo?.sharedBy}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              padding: 16,
              backgroundColor: colors.bgPanel,
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <div>
              <strong style={{ color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                Permission Level
              </strong>
              <span style={{ color: colors.accent, fontWeight: 600 }}>
                {shareInfo?.permissions === 'IMPORT' ? 'View & Import' : 'View Only'}
              </span>
            </div>
            <div>
              <strong style={{ color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                Access Count
              </strong>
              <span style={{ color: colors.text }}>
                {shareInfo?.accessCount} {shareInfo?.maxAccess ? `/ ${shareInfo.maxAccess}` : ''}
              </span>
            </div>
            <div>
              <strong style={{ color: colors.textMuted, display: 'block', marginBottom: 4 }}>Expires</strong>
              <span style={{ color: colors.text }}>
                {shareInfo?.expiresAt ? new Date(shareInfo.expiresAt).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', color: colors.text, fontSize: 20 }}>{profile?.name}</h2>
          {profile?.description && (
            <p style={{ margin: '0 0 20px 0', color: colors.textMuted, fontSize: 14 }}>
              {profile.description}
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* VPN Settings */}
            <div
              style={{
                padding: 16,
                backgroundColor: colors.bgPanel,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', color: colors.accent, fontSize: 16, fontWeight: 600 }}>
                VPN Configuration
              </h3>
              <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
                VPN credentials are not shared through links for security reasons.
              </p>
            </div>

            {/* Firewall Settings */}
            {profile?.firewallEnabled && (
              <div
                style={{
                  padding: 16,
                  backgroundColor: colors.bgPanel,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <h3 style={{ margin: '0 0 12px 0', color: colors.accent, fontSize: 16, fontWeight: 600 }}>
                  Firewall Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
                  <strong style={{ color: colors.textMuted }}>Status:</strong>
                  <span style={{ color: colors.accent }}>✓ Enabled</span>

                  <strong style={{ color: colors.textMuted }}>Default Action:</strong>
                  <span style={{ color: colors.text }}>{profile.defaultFirewallAction}</span>

                  <strong style={{ color: colors.textMuted }}>Rules Count:</strong>
                  <span style={{ color: colors.text }}>
                    {profile.firewallRules?.length || 0} rule(s) configured
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Import Button - only for IMPORT permission */}
        {shareInfo?.permissions === 'IMPORT' && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: importing ? colors.textMuted : colors.accent,
                color: theme === 'dark' ? '#121212' : '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: importing ? 'not-allowed' : 'pointer',
              }}
            >
              {importing ? 'Importing...' : 'Import Profile to My Account'}
            </button>
            <p style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>
              You must be logged in to import this profile
            </p>
          </div>
        )}

        {/* Back to Home Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={goToHome}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bgCard,
              color: colors.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedProfileViewer;