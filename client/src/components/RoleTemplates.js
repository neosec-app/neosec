import React, { useState, useEffect } from 'react';
import { roleTemplateAPI, getErrorMessage } from '../services/api';
import { FiShield, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const RoleTemplates = ({ theme = 'dark', palette = null }) => {
  const darkPalette = {
    bgMain: '#121212', bgCard: '#181818', text: '#ffffff', textMuted: '#9aa3b5',
    border: '#242424', accent: '#36E27B', danger: '#e04848'
  };
  const lightPalette = {
    bgMain: '#f6f8fb', bgCard: '#ffffff', text: '#0b172a', textMuted: '#5b6b7a',
    border: '#d9e2ec', accent: '#1fa45a', danger: '#d4183d'
  };
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: {} });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await roleTemplateAPI.getRoleTemplates();
      if (response.success) {
        setTemplates(response.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await roleTemplateAPI.createRoleTemplate(formData);
      if (response.success) {
        await fetchTemplates();
        setShowCreateModal(false);
        setFormData({ name: '', description: '', permissions: {} });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role template?')) return;
    try {
      const response = await roleTemplateAPI.deleteRoleTemplate(id);
      if (response.success) {
        await fetchTemplates();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: colors.bgMain, minHeight: '100vh', color: colors.text }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Role Templates</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.accent,
            color: theme === 'dark' ? '#121212' : '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiPlus style={{ width: '16px', height: '16px' }} />
          Create Template
        </button>
      </div>

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
        {templates.map(template => (
          <div key={template.id} style={{
            padding: '20px',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <FiShield style={{ width: '20px', height: '20px', color: colors.accent }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{template.name}</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: colors.textMuted }}>
              {template.description || 'No description'}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleDelete(template.id)}
                disabled={template.isSystem}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: colors.danger,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: template.isSystem ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: template.isSystem ? 0.5 : 1
                }}
              >
                <FiTrash2 style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%'
            }}
          >
            <h2 style={{ marginBottom: '16px' }}>Create Role Template</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.text
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.accent,
                  color: theme === 'dark' ? '#121212' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleTemplates;

