import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useParams } from 'react-router-dom'

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
        <h3 style={{ margin: '0 0 16px 0', color: colors.text, fontSize: 18, fontWeight: 600 }}>
          Confirm Action
        </h3>
        <p style={{ margin: '0 0 24px 0', color: colors.textMuted, fontSize: 14, lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onConfirm}
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
            Confirm
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bgCard,
              color: colors.text,
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

const LogsModal = ({ shareLink, onClose, colors, theme }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);


  const fetchLogs = useCallback(async () => {
    try {
      const response = await api.get(`/auth/shared-profiles/${shareLink.id}/logs`);
      setLogs(response.data.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [shareLink.id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);


  const getActionColor = (action) => {
    switch (action) {
      case 'CREATED':
        return colors.accent;
      case 'VIEWED':
        return '#3b82f6';
      case 'IMPORTED':
        return colors.accent;
      case 'REVOKED':
      case 'ACCESS_DENIED':
      case 'PASSWORD_FAILED':
        return colors.danger;
      case 'EXPIRED':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

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
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 24,
          maxWidth: 700,
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: colors.text, fontSize: 20, fontWeight: 600 }}>
            Activity Logs
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textMuted,
              cursor: 'pointer',
              fontSize: 24,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted }}>
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted }}>
            No activity yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: 16,
                  backgroundColor: colors.bgPanel,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: `${getActionColor(log.action)}20`,
                      color: getActionColor(log.action),
                    }}
                  >
                    {log.action}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                {log.accessorEmail && (
                  <div style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
                    <strong>User:</strong> {log.accessorEmail}
                  </div>
                )}

                {log.ipAddress && (
                  <div style={{ fontSize: 13, color: colors.textMuted }}>
                    <strong>IP:</strong> {log.ipAddress}
                  </div>
                )}

                {log.description && (
                  <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' }}>
                    {log.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ShareManagement = ({ theme = 'dark', palette }) => {
  const params = useParams();
  const profileId = params.profileId; 
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [shareLinks, setShareLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [logsModal, setLogsModal] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

const fetchShareLinks = useCallback(async () => {
  try {
    const url = profileId
      ? `/auth/shared-profiles/my/shares?profileId=${profileId}`
      : `/auth/shared-profiles/my/shares`;

    const response = await api.get(url);
    setShareLinks(response.data.data);
  } catch (error) {
    console.error('Error fetching share links:', error);
    showToast('Error loading share links', 'error');
  } finally {
    setLoading(false);
  }
}, [profileId]);

useEffect(() => {
  fetchShareLinks();
}, [fetchShareLinks]);

  const handleCopyLink = (shareToken) => {
    const url = `${window.location.origin}/shared-profiles/${shareToken}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!', 'success');
  };

  const handleRevoke = async (id) => {
    setConfirmModal({
      message: 'Are you sure you want to revoke this share link? All recipients will lose access immediately.',
      onConfirm: async () => {
        try {
          await api.put(`/shared-profiles/${id}/revoke`);
          showToast('Share link revoked successfully', 'success');
          fetchShareLinks();
        } catch (error) {
          console.error('Error revoking link:', error);
          showToast('Error revoking link', 'error');
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleDelete = async (id) => {
    setConfirmModal({
      message: 'Are you sure you want to delete this share link? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/shared-profiles/${id}`);
          showToast('Share link deleted successfully', 'success');
          fetchShareLinks();
        } catch (error) {
          console.error('Error deleting link:', error);
          showToast('Error deleting link', 'error');
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const handleViewLogs = (shareLink) => {
    setLogsModal(shareLink);
  };


  const getStatusColor = (shareLink) => {
    if (!shareLink.isActive || shareLink.revokedAt) return colors.danger;
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) return colors.warning;
    if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) return colors.warning;
    return colors.accent;
  };

  const getStatusText = (shareLink) => {
    if (!shareLink.isActive || shareLink.revokedAt) return 'Revoked';
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) return 'Expired';
    if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) return 'Limit Reached';
    return 'Active';
  };

  if (loading) {
    return (
      <div style={{ padding: 20, color: colors.text }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto', color: colors.text }}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          colors={colors}
          theme={theme}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
          colors={colors}
        />
      )}

      {logsModal && (
        <LogsModal
          shareLink={logsModal}
          onClose={() => setLogsModal(null)}
          colors={colors}
          theme={theme}
        />
      )}

      <h1 style={{ margin: '0 0 24px 0', fontSize: 30, fontWeight: 700 }}>
        Share Link Management
      </h1>

      {shareLinks.length === 0 ? (
        <div
          style={{
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h3 style={{ margin: '0 0 8px 0', color: colors.text }}>No Share Links Yet</h3>
          <p style={{ color: colors.textMuted }}>
            Create a share link from the Profile Manager to get started
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {shareLinks.map((link) => (
            <div
              key={link.id}
              style={{
                backgroundColor: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                      {link.profile?.name || 'Deleted Profile'}
                    </h3>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: `${getStatusColor(link)}20`,
                        color: getStatusColor(link),
                      }}
                    >
                      {getStatusText(link)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 12,
                      marginBottom: 12,
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong style={{ color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                        Permission
                      </strong>
                      <span style={{ color: colors.text }}>{link.permissions}</span>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                        Access Count
                      </strong>
                      <span style={{ color: colors.text }}>
                        {link.accessCount} {link.maxAccess ? `/ ${link.maxAccess}` : ''}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                        Expires
                      </strong>
                      <span style={{ color: colors.text }}>
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, display: 'block', marginBottom: 4 }}>
                        Created
                      </strong>
                      <span style={{ color: colors.text }}>
                        {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {link.isActive && !link.revokedAt && (
                    <div
                      style={{
                        backgroundColor: colors.bgPanel,
                        padding: 10,
                        borderRadius: 6,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: colors.textMuted,
                        wordBreak: 'break-all',
                      }}
                    >
                      {`${window.location.origin}/shared-profiles/${link.shareToken}`}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
                  {link.isActive && !link.revokedAt && (
                    <>
                      <button
                        onClick={() => handleCopyLink(link.shareToken)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: `1px solid ${colors.accent}`,
                          backgroundColor: 'transparent',
                          color: colors.accent,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Copy Link
                      </button>

                      <button
                        onClick={() => handleRevoke(link.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: `1px solid ${colors.warning}`,
                          backgroundColor: 'transparent',
                          color: colors.warning,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Revoke
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleViewLogs(link)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: 'transparent',
                      color: colors.text,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Logs
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: `1px solid ${colors.danger}`,
                      backgroundColor: 'transparent',
                      color: colors.danger,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
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
  );
};

export default ShareManagement;