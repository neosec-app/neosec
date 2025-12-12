import React, { useState, useEffect } from 'react';
import { mfaAPI, getErrorMessage } from '../services/api';
import { FiShield, FiCopy } from 'react-icons/fi';

const MFASettings = ({ theme = 'dark', palette = null }) => {
  const darkPalette = {
    bgMain: '#121212', bgCard: '#181818', text: '#ffffff', textMuted: '#9aa3b5',
    border: '#242424', accent: '#36E27B', danger: '#e04848'
  };
  const lightPalette = {
    bgMain: '#f6f8fb', bgCard: '#ffffff', text: '#0b172a', textMuted: '#5b6b7a',
    border: '#d9e2ec', accent: '#1fa45a', danger: '#d4183d'
  };
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [mfaSettings, setMfaSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [method, setMethod] = useState('authenticator_app');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    fetchMFASettings();
  }, []);

  const fetchMFASettings = async () => {
    try {
      setLoading(true);
      const response = await mfaAPI.getMFASettings();
      if (response.success) {
        setMfaSettings(response.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      const response = await mfaAPI.setupMFA(method);
      if (response.success) {
        setSecret(response.data.secret || '');
        setBackupCodes(response.data.backupCodes || []);
        setSetupMode(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleVerify = async () => {
    try {
      const response = await mfaAPI.verifyMFA(verificationCode);
      if (response.success) {
        await fetchMFASettings();
        setSetupMode(false);
        setVerificationCode('');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable MFA?')) return;
    try {
      const response = await mfaAPI.disableMFA();
      if (response.success) {
        await fetchMFASettings();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: colors.bgMain, minHeight: '100vh', color: colors.text }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 700 }}>Multi-Factor Authentication</h1>
      
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: theme === 'light' ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)',
          color: colors.danger,
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        padding: '24px',
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        maxWidth: '600px'
      }}>
        {mfaSettings?.enabled ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <FiShield style={{ width: '24px', height: '24px', color: colors.accent }} />
              <h2 style={{ margin: 0, fontSize: '20px' }}>MFA is Enabled</h2>
            </div>
            <p style={{ color: colors.textMuted, marginBottom: '24px' }}>
              Method: {mfaSettings.method === 'authenticator_app' ? 'Authenticator App' : 'Email OTP'}
            </p>
            <button
              onClick={handleDisable}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.danger,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Disable MFA
            </button>
          </div>
        ) : setupMode ? (
          <div>
            <h2 style={{ marginBottom: '16px' }}>Verify MFA Setup</h2>
            {method === 'authenticator_app' && secret && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: colors.textMuted, marginBottom: '8px' }}>Secret Key:</p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel,
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>
                  <span>{secret}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(secret)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <FiCopy style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
                {backupCodes.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ color: colors.textMuted, marginBottom: '8px' }}>Backup Codes (save these):</p>
                    <div style={{
                      padding: '12px',
                      backgroundColor: theme === 'light' ? '#fef3c7' : 'rgba(234, 179, 8, 0.2)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}>
                      {backupCodes.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                Enter verification code:
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text,
                  fontSize: '16px',
                  textAlign: 'center',
                  letterSpacing: '8px'
                }}
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: verificationCode.length === 6 ? colors.accent : colors.border,
                color: verificationCode.length === 6 ? (theme === 'dark' ? '#121212' : '#fff') : colors.textMuted,
                border: 'none',
                borderRadius: '8px',
                cursor: verificationCode.length === 6 ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Verify & Enable
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '16px' }}>Setup MFA</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Method:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text,
                  fontSize: '14px'
                }}
              >
                <option value="authenticator_app">Authenticator App (Google Authenticator, Authy)</option>
                <option value="email_otp">Email OTP</option>
              </select>
            </div>
            <button
              onClick={handleSetup}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: colors.accent,
                color: theme === 'dark' ? '#121212' : '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Setup MFA
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFASettings;

