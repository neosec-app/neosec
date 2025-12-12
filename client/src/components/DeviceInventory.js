import React, { useState, useEffect } from 'react';
import { deviceAPI, getErrorMessage } from '../services/api';
import { FiSmartphone, FiMonitor, FiServer, FiWifi, FiWifiOff, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const DeviceInventory = ({ theme = 'dark', palette = null, userId = null }) => {
  const darkPalette = {
    bgMain: '#121212', bgCard: '#181818', text: '#ffffff', textMuted: '#9aa3b5',
    border: '#242424', accent: '#36E27B', danger: '#e04848'
  };
  const lightPalette = {
    bgMain: '#f6f8fb', bgCard: '#ffffff', text: '#0b172a', textMuted: '#5b6b7a',
    border: '#d9e2ec', accent: '#1fa45a', danger: '#d4183d'
  };
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDevices();
  }, [userId]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = userId 
        ? await deviceAPI.getUserDevices(userId)
        : await deviceAPI.getAllDevices();
      if (response.success) {
        setDevices(response.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (osType) => {
    switch (osType) {
      case 'iOS':
      case 'Android':
        return <FiSmartphone style={{ width: '20px', height: '20px' }} />;
      case 'Windows':
      case 'macOS':
      case 'Linux':
        return <FiMonitor style={{ width: '20px', height: '20px' }} />;
      default:
        return <FiServer style={{ width: '20px', height: '20px' }} />;
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Loading devices...</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: colors.bgMain, minHeight: '100vh', color: colors.text }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 700 }}>Device Inventory</h1>
      
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {devices.map(device => (
          <div key={device.id} style={{
            padding: '20px',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              {getDeviceIcon(device.osType)}
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{device.deviceName}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                  {device.osType} {device.osVersion}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {device.vpnStatus === 'connected' ? (
                  <FiWifi style={{ width: '16px', height: '16px', color: colors.accent }} />
                ) : (
                  <FiWifiOff style={{ width: '16px', height: '16px', color: colors.textMuted }} />
                )}
                <span>VPN: {device.vpnStatus}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {device.firewallSyncStatus === 'synced' ? (
                  <FiCheckCircle style={{ width: '16px', height: '16px', color: colors.accent }} />
                ) : (
                  <FiXCircle style={{ width: '16px', height: '16px', color: colors.textMuted }} />
                )}
                <span>Firewall: {device.firewallSyncStatus}</span>
              </div>
              
              <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                Last online: {device.lastOnlineAt 
                  ? new Date(device.lastOnlineAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: colors.textMuted
        }}>
          No devices found
        </div>
      )}
    </div>
  );
};

export default DeviceInventory;

