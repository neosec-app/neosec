import React, { useState } from 'react';
import api from '../services/api';

const ShareCreationModal = ({ profile, onClose, onSuccess, theme = 'dark', palette }) => {
  const [formData, setFormData] = useState({
    permissions: 'VIEW',
    password: '',
    expiresInDays: '',
    maxAccess: ''
  });
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [error, setError] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/shared-profiles', {
        profileId: profile.id,
        permissions: formData.permissions,
        password: formData.password.trim() || undefined,
        expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : undefined,
        maxAccess: formData.maxAccess ? parseInt(formData.maxAccess) : undefined
      });

      if (response.data.success) {
        setShareLink(response.data.data.shareUrl);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      setError(error.response?.data?.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: palette.bgCard,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: 24,
            maxWidth: 600,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, color: palette.text, fontSize: 20, fontWeight: 600 }}>
              Share Profile: {profile.name}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: palette.textMuted,
                fontSize: 24,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          {/* Security Warning */}
          <div
            style={{
              backgroundColor: theme === 'dark' ? '#2a2a1a' : 'rgba(240,165,0,0.1)',
              border: `1px solid ${palette.warning}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
              fontSize: 13,
              color: palette.textMuted
            }}
          >
            <strong style={{ color: palette.warning }}>Security Notice:</strong> VPN credentials will NOT be shared.
            Only firewall rules and non-sensitive settings will be included.
          </div>

          {error && (
            <div
              style={{
                backgroundColor: theme === 'dark' ? '#2A1515' : 'rgba(212,24,61,0.08)',
                border: `1px solid ${palette.danger}`,
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
                color: palette.danger,
                fontSize: 14
              }}
            >
              {error}
            </div>
          )}

          {shareLink ? (
            // Success view
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: palette.text, fontSize: 16 }}>
                Share Link Created!
              </h3>
              <p style={{ margin: '0 0 16px 0', color: palette.textMuted, fontSize: 14 }}>
                Share this link with others to give them access to your profile.
              </p>
              <div
                style={{
                  padding: 16,
                  backgroundColor: palette.bgPanel,
                  borderRadius: 8,
                  marginBottom: 16,
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: palette.text,
                  border: `1px solid ${palette.border}`
                }}
              >
                {shareLink}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {/* <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: palette.accent,
                    color: theme === 'dark' ? '#121212' : '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Copy Link
                </button> */}
                <button
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: 'transparent',
                    color: palette.text,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Form view
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    color: palette.text,
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Permission Level *
                </label>
                <select
                  value={formData.permissions}
                  onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: 12,
                    backgroundColor: palette.inputBg,
                    border: `1px solid ${palette.inputBorder}`,
                    borderRadius: 8,
                    color: palette.text,
                    fontSize: 14
                  }}
                >
                  <option value="VIEW">View Only - Recipients can view but not import</option>
                  <option value="IMPORT">View & Import - Recipients can import to their account</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    color: palette.text,
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Password Protection (Optional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave empty for no password"
                  style={{
                    width: '100%',
                    padding: 12,
                    backgroundColor: palette.inputBg,
                    border: `1px solid ${palette.inputBorder}`,
                    borderRadius: 8,
                    color: palette.text,
                    fontSize: 14
                  }}
                />
                <small style={{ color: palette.textMuted, fontSize: 12, marginTop: 4, display: 'block' }}>
                  Add a password to restrict access
                </small>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    color: palette.text,
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Link Expiration (Optional)
                </label>
                <input
                  type="number"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                  placeholder="Days until expiration"
                  min="1"
                  style={{
                    width: '100%',
                    padding: 12,
                    backgroundColor: palette.inputBg,
                    border: `1px solid ${palette.inputBorder}`,
                    borderRadius: 8,
                    color: palette.text,
                    fontSize: 14
                  }}
                />
                <small style={{ color: palette.textMuted, fontSize: 12, marginTop: 4, display: 'block' }}>
                  Leave empty for a link that never expires
                </small>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    color: palette.text,
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Maximum Access Count (Optional)
                </label>
                <input
                  type="number"
                  value={formData.maxAccess}
                  onChange={(e) => setFormData({ ...formData, maxAccess: e.target.value })}
                  placeholder="Maximum number of accesses"
                  min="1"
                  style={{
                    width: '100%',
                    padding: 12,
                    backgroundColor: palette.inputBg,
                    border: `1px solid ${palette.inputBorder}`,
                    borderRadius: 8,
                    color: palette.text,
                    fontSize: 14
                  }}
                />
                <small style={{ color: palette.textMuted, fontSize: 12, marginTop: 4, display: 'block' }}>
                  Limit how many times this link can be accessed
                </small>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: 12,
                    backgroundColor: loading ? palette.textMuted : palette.accent,
                    color: theme === 'dark' ? '#121212' : '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 14
                  }}
                >
                  {loading ? 'Creating...' : 'Create Share Link'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: 'transparent',
                    color: palette.text,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Copy Toast */}
      {showCopyToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            backgroundColor: theme === 'dark' ? '#1a3a2a' : 'rgba(31,164,90,0.1)',
            border: `1px solid ${palette.accent}`,
            borderRadius: '8px',
            color: theme === 'dark' ? '#7fdf9f' : palette.accent,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10002,
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          ✓ Link copied to clipboard!
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
};

export default ShareCreationModal;