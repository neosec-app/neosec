import React, { useState, useEffect } from 'react';
import { notificationAPI, getErrorMessage } from '../services/api';
import { FiBell, FiAlertTriangle } from 'react-icons/fi';

const AdminNotifications = ({ theme = 'dark', palette = null }) => {
  const darkPalette = {
    bgMain: '#121212', bgCard: '#181818', text: '#ffffff', textMuted: '#9aa3b5',
    border: '#242424', accent: '#36E27B', warning: '#f0a500', danger: '#e04848'
  };
  const lightPalette = {
    bgMain: '#f6f8fb', bgCard: '#ffffff', text: '#0b172a', textMuted: '#5b6b7a',
    border: '#d9e2ec', accent: '#1fa45a', warning: '#d97706', danger: '#d4183d'
  };
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch admin-specific notifications
      const response = await notificationAPI.getNotifications({ priority: 'critical' });
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <FiAlertTriangle style={{ width: '20px', height: '20px', color: colors.danger }} />;
      case 'high':
        return <FiAlertTriangle style={{ width: '20px', height: '20px', color: colors.warning }} />;
      default:
        return <FiBell style={{ width: '20px', height: '20px', color: colors.accent }} />;
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: colors.bgMain, minHeight: '100vh', color: colors.text }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 700 }}>Admin Notifications</h1>
      
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
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: colors.textMuted
          }}>
            No critical notifications
          </div>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} style={{
              padding: '20px',
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              {getNotificationIcon(notification.priority)}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                  {notification.title}
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: colors.textMuted }}>
                  {notification.message}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {notification.status === 'unread' && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: colors.accent
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;

