import React, { useState, useEffect } from 'react';
import { featureToggleAPI, getErrorMessage } from '../services/api';
import { FiToggleLeft, FiToggleRight, FiSettings } from 'react-icons/fi';

const FeatureToggles = ({ theme = 'dark', palette = null }) => {
  const darkPalette = {
    bgMain: '#121212', bgCard: '#181818', text: '#ffffff', textMuted: '#9aa3b5',
    border: '#242424', accent: '#36E27B'
  };
  const lightPalette = {
    bgMain: '#f6f8fb', bgCard: '#ffffff', text: '#0b172a', textMuted: '#5b6b7a',
    border: '#d9e2ec', accent: '#1fa45a'
  };
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [toggles, setToggles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchToggles();
  }, []);

  const fetchToggles = async () => {
    try {
      setLoading(true);
      const response = await featureToggleAPI.getFeatureToggles();
      if (response.success) {
        setToggles(response.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (toggleId, enabled) => {
    try {
      const toggle = toggles.find(t => t.id === toggleId);
      const response = await featureToggleAPI.setFeatureToggle({
        featureName: toggle.featureName,
        enabled: !enabled,
        targetType: toggle.targetType,
        targetId: toggle.targetId,
        targetRole: toggle.targetRole
      });
      if (response.success) {
        await fetchToggles();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const featureNames = {
    firewall_editing: 'Firewall Editing',
    vpn_config_modification: 'VPN Config Modification',
    profile_sharing: 'Profile Sharing',
    scheduled_rules: 'Scheduled Rules',
    advanced_threat_detection: 'Advanced Threat Detection',
    device_management: 'Device Management'
  };

  return (
    <div style={{ padding: '24px', backgroundColor: colors.bgMain, minHeight: '100vh', color: colors.text }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 700 }}>Feature Toggles</h1>
      
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
        display: 'grid',
        gap: '16px'
      }}>
        {toggles.map(toggle => (
          <div key={toggle.id} style={{
            padding: '20px',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                {featureNames[toggle.featureName] || toggle.featureName}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                Target: {toggle.targetType} {toggle.targetId ? `(${toggle.targetId})` : ''}
              </p>
            </div>
            <button
              onClick={() => handleToggle(toggle.id, toggle.enabled)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: toggle.enabled ? colors.accent : colors.textMuted,
                fontSize: '32px'
              }}
            >
              {toggle.enabled ? (
                <FiToggleRight style={{ width: '48px', height: '48px' }} />
              ) : (
                <FiToggleLeft style={{ width: '48px', height: '48px' }} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureToggles;

