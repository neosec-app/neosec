import React, { useState, useEffect } from 'react';
import { firewallAPI, getErrorMessage } from '../services/api';
import { MdModeEdit } from 'react-icons/md';
import { SlReload } from 'react-icons/sl';
import { RiDeleteBin6Line } from 'react-icons/ri';

const FirewallRuleManagement = ({ theme = 'light', palette = null }) => {
    // Default palettes
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
    };

    const colors = palette || (theme === 'light' ? lightPalette : darkPalette);
    const isMobile = window.innerWidth < 768;

    // State
    const [firewallRules, setFirewallRules] = useState([]);
    const [firewallLoading, setFirewallLoading] = useState(true);
    const [firewallError, setFirewallError] = useState('');
    const [showFirewallModal, setShowFirewallModal] = useState(false);
    const [firewallModalAnimating, setFirewallModalAnimating] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState(null);
    const [confirmDeleteRuleId, setConfirmDeleteRuleId] = useState(null);
    const [actionButtonHover, setActionButtonHover] = useState(null);

    const initialFirewallForm = {
        action: 'allow',
        direction: 'inbound',
        protocol: 'tcp',
        sourceIPType: 'any',
        sourceIP: '',
        destinationIPType: 'any',
        destinationIP: '',
        sourcePortType: 'any',
        sourcePort: '',
        destinationPortType: 'any',
        destinationPort: '',
        description: '',
        enabled: true
    };
    const [firewallForm, setFirewallForm] = useState(initialFirewallForm);

    // Fetch firewall rules
    const fetchFirewallRules = async () => {
        try {
            setFirewallLoading(true);
            setFirewallError('');
            const response = await firewallAPI.getRules();
            if (response.success) {
                setFirewallRules(response.data || []);
            } else {
                setFirewallError(response.message || 'Failed to load firewall rules');
            }
        } catch (error) {
            console.error('Firewall fetch error:', error);
            setFirewallError(getErrorMessage(error, 'Failed to load firewall rules'));
        } finally {
            setFirewallLoading(false);
        }
    };

    useEffect(() => {
        fetchFirewallRules();
    }, []);

    // Modal handlers
    const openFirewallModal = () => {
        console.log('Opening firewall modal');
        setFirewallForm(initialFirewallForm);
        setEditingRuleId(null);
        setShowFirewallModal(true);
        // Trigger animation immediately
        requestAnimationFrame(() => {
            setFirewallModalAnimating(true);
        });
    };

    const closeFirewallModal = () => {
        setFirewallModalAnimating(false);
        setTimeout(() => {
            setFirewallForm(initialFirewallForm);
            setEditingRuleId(null);
            setShowFirewallModal(false);
        }, 200);
    };

    // Form handlers
    const handleFirewallChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFirewallForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveRule = async (e) => {
        e.preventDefault();
        setFirewallError('');
        setFirewallLoading(true);
        try {
            const payload = {
                action: firewallForm.action,
                direction: firewallForm.direction,
                protocol: firewallForm.protocol,
                sourceIP: firewallForm.sourceIPType === 'any' ? null : (firewallForm.sourceIP || null),
                destinationIP: firewallForm.destinationIPType === 'any' ? null : (firewallForm.destinationIP || null),
                sourcePort: firewallForm.sourcePortType === 'any' ? null : (firewallForm.sourcePort || null),
                destinationPort: firewallForm.destinationPortType === 'any' ? null : (firewallForm.destinationPort || null),
                description: firewallForm.description || null,
                enabled: firewallForm.enabled
            };

            let response;
            if (editingRuleId) {
                response = await firewallAPI.updateRule(editingRuleId, payload);
                if (response.success) {
                    setFirewallRules((prev) =>
                        prev.map((rule) => (rule.id === editingRuleId ? response.data : rule))
                    );
                    showToast('Firewall rule updated', 'success');
                }
            } else {
                response = await firewallAPI.createRule(payload);
                if (response.success) {
                    setFirewallRules((prev) => [response.data, ...prev]);
                    showToast('Firewall rule added', 'success');
                }
            }

            if (!response?.success) {
                setFirewallError(response?.message || 'Failed to save firewall rule');
                showToast(response?.message || 'Failed to save firewall rule', 'error');
                return;
            }

            closeFirewallModal();
        } catch (error) {
            console.error('Save firewall rule error:', error);
            const msg = error.response?.data?.message || 'Failed to save firewall rule';
            setFirewallError(msg);
            showToast(msg, 'error');
        } finally {
            setFirewallLoading(false);
        }
    };

    const handleEditRule = (rule) => {
        console.log('Editing rule:', rule);
        setEditingRuleId(rule.id);
        // Ensure protocol is either TCP or UDP, default to TCP if not
        const validProtocol = (rule.protocol === 'tcp' || rule.protocol === 'udp') ? rule.protocol : 'tcp';
        setFirewallForm({
            action: rule.action,
            direction: rule.direction,
            protocol: validProtocol,
            sourceIPType: rule.sourceIP ? (rule.sourceIP.includes('/') ? 'range' : 'specific') : 'any',
            sourceIP: rule.sourceIP || '',
            destinationIPType: rule.destinationIP ? (rule.destinationIP.includes('/') ? 'range' : 'specific') : 'any',
            destinationIP: rule.destinationIP || '',
            sourcePortType: rule.sourcePort ? (rule.sourcePort.includes('-') ? 'range' : 'specific') : 'any',
            sourcePort: rule.sourcePort || '',
            destinationPortType: rule.destinationPort ? (rule.destinationPort.includes('-') ? 'range' : 'specific') : 'any',
            destinationPort: rule.destinationPort || '',
            description: rule.description || '',
            enabled: rule.enabled !== undefined ? rule.enabled : true
        });
        setShowFirewallModal(true);
        // Trigger animation immediately
        requestAnimationFrame(() => {
            setFirewallModalAnimating(true);
        });
    };

    const handleDeleteRule = (id) => {
        setConfirmDeleteRuleId(id);
    };

    const confirmDeleteRule = async () => {
        if (!confirmDeleteRuleId) return;
        setFirewallError('');
        try {
            const response = await firewallAPI.deleteRule(confirmDeleteRuleId);
            if (response.success) {
                setFirewallRules((prev) => prev.filter((rule) => rule.id !== confirmDeleteRuleId));
                showToast('Firewall rule deleted', 'success');
            } else {
                setFirewallError(response.message || 'Failed to delete firewall rule');
                showToast(response.message || 'Failed to delete firewall rule', 'error');
            }
        } catch (error) {
            console.error('Delete firewall rule error:', error);
            const msg = error.response?.data?.message || 'Failed to delete firewall rule';
            setFirewallError(msg);
            showToast(msg, 'error');
        } finally {
            setConfirmDeleteRuleId(null);
        }
    };

    const handleMoveRuleUp = async (id, idx) => {
        if (idx === 0) return;
        const newRules = [...firewallRules];
        [newRules[idx - 1], newRules[idx]] = [newRules[idx], newRules[idx - 1]];
        setFirewallRules(newRules);
        // Update order on server
        try {
            await firewallAPI.updateRule(newRules[idx - 1].id, { order: newRules[idx - 1].order - 1 });
            await firewallAPI.updateRule(newRules[idx].id, { order: newRules[idx].order + 1 });
        } catch (error) {
            console.error('Error updating rule order:', error);
            fetchFirewallRules(); // Revert on error
        }
    };

    const handleMoveRuleDown = async (id, idx) => {
        if (idx === firewallRules.length - 1) return;
        const newRules = [...firewallRules];
        [newRules[idx], newRules[idx + 1]] = [newRules[idx + 1], newRules[idx]];
        setFirewallRules(newRules);
        // Update order on server
        try {
            await firewallAPI.updateRule(newRules[idx].id, { order: newRules[idx].order - 1 });
            await firewallAPI.updateRule(newRules[idx + 1].id, { order: newRules[idx + 1].order + 1 });
        } catch (error) {
            console.error('Error updating rule order:', error);
            fetchFirewallRules(); // Revert on error
        }
    };

    const handleResetRule = async (id) => {
        // Refresh rule from server
        await fetchFirewallRules();
        showToast('Rule refreshed', 'success');
    };

    // Toast notification system
    const [toasts, setToasts] = useState([]);
    const showToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    const cardBase = {
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '20px'
    };

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <h1 style={{
                    fontSize: isMobile ? '18px' : '24px',
                    margin: 0,
                    color: colors.text,
                    fontWeight: 600,
                    paddingLeft: isMobile ? '48px' : '0',
                    transition: 'padding-left 0.3s ease',
                    flex: isMobile ? '1 1 100%' : 'none'
                }}>Firewall Rule Management</h1>
                <button
                    type="button"
                    onClick={() => {
                        console.log('Add New Rule button clicked');
                        openFirewallModal();
                    }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: colors.accent,
                        color: theme === 'dark' ? '#121212' : '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.opacity = '0.9';
                        e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'translateY(0)';
                    }}>
                    + Add New Rule
                </button>
            </div>

            {/* Error Message */}
            {firewallError && (
                <div style={{
                    ...cardBase,
                    backgroundColor: colors.danger + '20',
                    borderColor: colors.danger,
                    color: colors.danger,
                    marginBottom: '16px'
                }}>
                    {firewallError}
                </div>
            )}

            {/* Rules Table */}
            <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
                {firewallLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>Loading rules...</div>
                ) : firewallRules.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: colors.textMuted }}>No firewall rules yet. Click "+ Add New Rule" to create your first rule.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: theme === 'light' ? '#f8f9fa' : colors.bgPanel }}>
                                    <th style={{ padding: '14px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, fontSize: '13px' }}>Order</th>
                                    <th style={{ padding: '14px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, fontSize: '13px' }}>Action</th>
                                    <th style={{ padding: '14px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, fontSize: '13px' }}>Source</th>
                                    <th style={{ padding: '14px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, fontSize: '13px' }}>Destination</th>
                                    <th style={{ padding: '14px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, fontSize: '13px' }}>Protocol</th>
                                    <th style={{ padding: '14px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, fontSize: '13px' }}>Port</th>
                                    <th style={{ padding: '14px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, fontSize: '13px' }}>Description</th>
                                    <th style={{ padding: '14px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, fontSize: '13px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {firewallRules.map((rule, idx) => (
                                    <tr key={rule.id} style={{
                                        borderBottom: idx === firewallRules.length - 1 ? 'none' : `1px solid ${colors.border}`
                                    }}>
                                        <td style={{ padding: '14px 12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => handleMoveRuleUp(rule.id, idx)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: colors.textMuted,
                                                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                        opacity: idx === 0 ? 0.3 : 1,
                                                        fontSize: '12px',
                                                        padding: '2px'
                                                    }}
                                                    disabled={idx === 0}
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    onClick={() => handleMoveRuleDown(rule.id, idx)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: colors.textMuted,
                                                        cursor: idx === firewallRules.length - 1 ? 'not-allowed' : 'pointer',
                                                        opacity: idx === firewallRules.length - 1 ? 0.3 : 1,
                                                        fontSize: '12px',
                                                        padding: '2px'
                                                    }}
                                                    disabled={idx === firewallRules.length - 1}
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 12px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                backgroundColor: rule.action === 'allow'
                                                    ? (theme === 'dark' ? '#1E402C' : '#e6f4ed')
                                                    : (theme === 'dark' ? '#40201E' : '#fee2e2'),
                                                color: rule.action === 'allow'
                                                    ? (theme === 'dark' ? '#36E27B' : '#1fa45a')
                                                    : (theme === 'dark' ? '#FF7777' : '#d4183d'),
                                                border: rule.action === 'allow'
                                                    ? (theme === 'dark' ? '1px solid #36E27B' : '1px solid #1fa45a')
                                                    : (theme === 'dark' ? '1px solid #FF7777' : '1px solid #d4183d')
                                            }}>
                                                {rule.action === 'allow' ? '✓' : '✗'} {rule.action === 'allow' ? 'Allow' : 'Deny'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 12px', color: colors.text, fontSize: '14px' }}>
                                            {rule.sourceIP || 'Any'}
                                        </td>
                                        <td style={{ padding: '14px 12px', color: colors.text, fontSize: '14px' }}>
                                            {rule.destinationIP || 'Any'}
                                        </td>
                                        <td style={{ padding: '14px 12px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                backgroundColor: theme === 'light' ? '#f1f3f5' : '#2a2a2a',
                                                color: colors.textMuted,
                                                fontWeight: 500
                                            }}>
                                                {(rule.protocol || 'tcp').toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 12px', color: colors.text, fontSize: '14px' }}>
                                            {rule.destinationPort || rule.sourcePort || 'Any'}
                                        </td>
                                        <td style={{ padding: '14px 12px', color: colors.text, fontSize: '14px' }}>
                                            {rule.description || '—'}
                                        </td>
                                        <td style={{ padding: '14px 12px' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => handleResetRule(rule.id)}
                                                    onMouseEnter={() => setActionButtonHover(`reset-${rule.id}`)}
                                                    onMouseLeave={() => setActionButtonHover(null)}
                                                    title="Reset/Refresh"
                                                    style={{
                                                        background: actionButtonHover === `reset-${rule.id}`
                                                            ? (theme === 'dark' ? 'rgba(54,226,123,0.15)' : 'rgba(31,164,90,0.1)')
                                                            : 'none',
                                                        border: 'none',
                                                        color: actionButtonHover === `reset-${rule.id}`
                                                            ? colors.accent
                                                            : colors.textMuted,
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        padding: '4px 6px',
                                                        borderRadius: '6px',
                                                        transition: 'all 0.15s ease',
                                                        transform: actionButtonHover === `reset-${rule.id}` ? 'scale(1.1)' : 'scale(1)'
                                                    }}
                                                >
                                                    <SlReload />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        console.log('Edit button clicked for rule:', rule.id);
                                                        handleEditRule(rule);
                                                    }}
                                                    onMouseEnter={() => setActionButtonHover(`edit-${rule.id}`)}
                                                    onMouseLeave={() => setActionButtonHover(null)}
                                                    title="Edit"
                                                    style={{
                                                        background: actionButtonHover === `edit-${rule.id}`
                                                            ? (theme === 'dark' ? 'rgba(54,226,123,0.15)' : 'rgba(31,164,90,0.1)')
                                                            : 'none',
                                                        border: 'none',
                                                        color: actionButtonHover === `edit-${rule.id}`
                                                            ? colors.accent
                                                            : colors.textMuted,
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        padding: '4px 6px',
                                                        borderRadius: '6px',
                                                        transition: 'all 0.15s ease',
                                                        transform: actionButtonHover === `edit-${rule.id}` ? 'scale(1.1)' : 'scale(1)'
                                                    }}
                                                >
                                                    <MdModeEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    onMouseEnter={() => setActionButtonHover(`delete-${rule.id}`)}
                                                    onMouseLeave={() => setActionButtonHover(null)}
                                                    title="Delete"
                                                    style={{
                                                        background: actionButtonHover === `delete-${rule.id}`
                                                            ? (theme === 'dark' ? 'rgba(224,72,72,0.15)' : 'rgba(212,24,61,0.1)')
                                                            : 'none',
                                                        border: 'none',
                                                        color: colors.danger,
                                                        cursor: 'pointer',
                                                        fontSize: '16px',
                                                        padding: '4px 6px',
                                                        borderRadius: '6px',
                                                        transition: 'all 0.15s ease',
                                                        transform: actionButtonHover === `delete-${rule.id}` ? 'scale(1.1)' : 'scale(1)',
                                                        opacity: actionButtonHover === `delete-${rule.id}` ? 1 : 0.8
                                                    }}
                                                >
                                                    <RiDeleteBin6Line />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Firewall Modal */}
            {showFirewallModal && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            closeFirewallModal();
                        }
                    }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        opacity: 1,
                        transition: 'opacity 0.3s ease'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: theme === 'light' ? '#ffffff' : colors.bgCard,
                            padding: '32px',
                            borderRadius: '16px',
                            border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${colors.border}`,
                            width: '90%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            boxShadow: theme === 'light'
                                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                            transform: firewallModalAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-20px)',
                            opacity: 1,
                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeFirewallModal}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                color: colors.textMuted,
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                transition: 'all 0.2s ease',
                                lineHeight: 1
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = colors.text;
                                e.target.style.backgroundColor = theme === 'light' ? '#f3f4f6' : 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = colors.textMuted;
                                e.target.style.backgroundColor = 'transparent';
                            }}
                        >
                            ×
                        </button>

                        <h2 style={{
                            color: colors.text,
                            marginTop: 0,
                            marginBottom: '6px',
                            fontSize: '24px',
                            fontWeight: 700
                        }}>
                            {editingRuleId ? 'Edit Firewall Rule' : 'Add New Firewall Rule'}
                        </h2>
                        <p style={{
                            color: colors.textMuted,
                            marginTop: 0,
                            marginBottom: '28px',
                            fontSize: '14px',
                            fontWeight: 400
                        }}>
                            Configure the firewall rule settings below
                        </p>

                        <form onSubmit={handleSaveRule}>
                            {/* Rule Description */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: 500, fontSize: '14px' }}>
                                    Rule Description
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        name="description"
                                        value={firewallForm.description}
                                        onChange={handleFirewallChange}
                                        placeholder="e.g., Allow HTTPS traffic from anywhere"
                                        style={{
                                            width: '100%',
                                            padding: '12px 40px 12px 14px',
                                            backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '8px',
                                            color: colors.text,
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    {firewallForm.description && (
                                        <span style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: colors.accent,
                                            fontSize: '18px'
                                        }}>✓</span>
                                    )}
                                </div>
                            </div>

                            {/* Action - Radio Buttons */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', color: colors.text, fontWeight: 500, fontSize: '14px' }}>
                                    Action
                                </label>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: `2px solid ${firewallForm.action === 'allow' ? colors.accent : colors.border}`,
                                        backgroundColor: firewallForm.action === 'allow' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="action"
                                            value="allow"
                                            checked={firewallForm.action === 'allow'}
                                            onChange={handleFirewallChange}
                                            style={{ display: 'none' }}
                                        />
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            backgroundColor: firewallForm.action === 'allow' ? colors.accent : 'transparent',
                                            border: `2px solid ${firewallForm.action === 'allow' ? colors.accent : colors.border}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {firewallForm.action === 'allow' ? '✓' : ''}
                                        </div>
                                        <span style={{ color: colors.text, fontSize: '14px', fontWeight: 500 }}>Allow</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: `2px solid ${firewallForm.action === 'deny' ? colors.danger : colors.border}`,
                                        backgroundColor: firewallForm.action === 'deny' ? (theme === 'light' ? 'rgba(212,24,61,0.1)' : 'rgba(224,72,72,0.1)') : 'transparent',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="action"
                                            value="deny"
                                            checked={firewallForm.action === 'deny'}
                                            onChange={handleFirewallChange}
                                            style={{ display: 'none' }}
                                        />
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            backgroundColor: firewallForm.action === 'deny' ? colors.danger : 'transparent',
                                            border: `2px solid ${firewallForm.action === 'deny' ? colors.danger : colors.border}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {firewallForm.action === 'deny' ? '✗' : ''}
                                        </div>
                                        <span style={{ color: colors.text, fontSize: '14px', fontWeight: 500 }}>Deny</span>
                                    </label>
                                </div>
                            </div>

                            {/* Protocol - Only TCP and UDP */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: colors.text, fontWeight: 500, fontSize: '14px' }}>
                                    Protocol
                                </label>
                                <select
                                    name="protocol"
                                    value={firewallForm.protocol}
                                    onChange={handleFirewallChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: '8px',
                                        color: colors.text,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%231a1a1a' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 14px center',
                                        backgroundSize: '12px',
                                        paddingRight: '40px'
                                    }}
                                >
                                    <option value="tcp">TCP</option>
                                    <option value="udp">UDP</option>
                                </select>
                            </div>

                            {/* Source IP/Range - Radio Buttons */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', color: colors.text, fontWeight: 500, fontSize: '14px' }}>
                                    Source IP/Range
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: firewallForm.sourceIPType !== 'any' ? '12px' : '0' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.sourceIPType === 'any' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.sourceIPType === 'any' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="sourceIPType"
                                            value="any"
                                            checked={firewallForm.sourceIPType === 'any'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Any</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.sourceIPType === 'specific' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.sourceIPType === 'specific' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="sourceIPType"
                                            value="specific"
                                            checked={firewallForm.sourceIPType === 'specific'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Specific IP</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.sourceIPType === 'range' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.sourceIPType === 'range' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="sourceIPType"
                                            value="range"
                                            checked={firewallForm.sourceIPType === 'range'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>IP Range/CIDR</span>
                                    </label>
                                </div>
                                {firewallForm.sourceIPType !== 'any' && (
                                    <input
                                        type="text"
                                        name="sourceIP"
                                        value={firewallForm.sourceIP}
                                        onChange={handleFirewallChange}
                                        placeholder={firewallForm.sourceIPType === 'range' ? 'e.g., 192.168.1.0/24' : 'e.g., 192.168.1.1'}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '8px',
                                            color: colors.text,
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Destination IP/Range - Radio Buttons */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', color: colors.text, fontWeight: 500, fontSize: '14px' }}>
                                    Destination IP/Range
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: firewallForm.destinationIPType !== 'any' ? '12px' : '0' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.destinationIPType === 'any' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.destinationIPType === 'any' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="destinationIPType"
                                            value="any"
                                            checked={firewallForm.destinationIPType === 'any'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Any</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.destinationIPType === 'specific' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.destinationIPType === 'specific' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="destinationIPType"
                                            value="specific"
                                            checked={firewallForm.destinationIPType === 'specific'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Specific IP</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.destinationIPType === 'range' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.destinationIPType === 'range' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="destinationIPType"
                                            value="range"
                                            checked={firewallForm.destinationIPType === 'range'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>IP Range/CIDR</span>
                                    </label>
                                </div>
                                {firewallForm.destinationIPType !== 'any' && (
                                    <input
                                        type="text"
                                        name="destinationIP"
                                        value={firewallForm.destinationIP}
                                        onChange={handleFirewallChange}
                                        placeholder={firewallForm.destinationIPType === 'range' ? 'e.g., 192.168.1.0/24' : 'e.g., 192.168.1.1'}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '8px',
                                            color: colors.text,
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Source Port - Radio Buttons */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', color: colors.text, fontWeight: 500, fontSize: '14px' }}>
                                    Source Port
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: firewallForm.sourcePortType !== 'any' ? '12px' : '0' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.sourcePortType === 'any' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.sourcePortType === 'any' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="sourcePortType"
                                            value="any"
                                            checked={firewallForm.sourcePortType === 'any'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Any</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.sourcePortType === 'specific' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.sourcePortType === 'specific' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="sourcePortType"
                                            value="specific"
                                            checked={firewallForm.sourcePortType === 'specific'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Specific Port</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.sourcePortType === 'range' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.sourcePortType === 'range' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="sourcePortType"
                                            value="range"
                                            checked={firewallForm.sourcePortType === 'range'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Port Range</span>
                                    </label>
                                </div>
                                {firewallForm.sourcePortType !== 'any' && (
                                    <input
                                        type="text"
                                        name="sourcePort"
                                        value={firewallForm.sourcePort}
                                        onChange={handleFirewallChange}
                                        placeholder={firewallForm.sourcePortType === 'range' ? 'e.g., 8000-9000' : 'e.g., 80'}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '8px',
                                            color: colors.text,
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Destination Port - Radio Buttons */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '12px', color: colors.text, fontWeight: 500, fontSize: '14px' }}>
                                    Destination Port
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: firewallForm.destinationPortType !== 'any' ? '12px' : '0' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.destinationPortType === 'any' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.destinationPortType === 'any' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="destinationPortType"
                                            value="any"
                                            checked={firewallForm.destinationPortType === 'any'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Any</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.destinationPortType === 'specific' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.destinationPortType === 'specific' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="destinationPortType"
                                            value="specific"
                                            checked={firewallForm.destinationPortType === 'specific'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Specific Port</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: firewallForm.destinationPortType === 'range' ? (theme === 'light' ? colors.accentSoft : 'rgba(54,226,123,0.1)') : 'transparent',
                                        border: `1px solid ${firewallForm.destinationPortType === 'range' ? colors.accent : 'transparent'}`,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <input
                                            type="radio"
                                            name="destinationPortType"
                                            value="range"
                                            checked={firewallForm.destinationPortType === 'range'}
                                            onChange={handleFirewallChange}
                                        />
                                        <span style={{ color: colors.text, fontSize: '14px' }}>Port Range</span>
                                    </label>
                                </div>
                                {firewallForm.destinationPortType !== 'any' && (
                                    <input
                                        type="text"
                                        name="destinationPort"
                                        value={firewallForm.destinationPort}
                                        onChange={handleFirewallChange}
                                        placeholder={firewallForm.destinationPortType === 'range' ? 'e.g., 8000-9000' : 'e.g., 80'}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            backgroundColor: theme === 'light' ? '#fff' : colors.bgPanel,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '8px',
                                            color: colors.text,
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Enable Rule - Toggle Switch */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '4px', color: colors.text, fontWeight: 500, fontSize: '14px' }}>
                                            Enable Rule
                                        </label>
                                        <span style={{ color: colors.textMuted, fontSize: '13px' }}>
                                            {firewallForm.enabled ? 'Rule is enabled and will be applied' : 'Rule is disabled'}
                                        </span>
                                    </div>
                                    <label style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        width: '52px',
                                        height: '28px',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            name="enabled"
                                            checked={firewallForm.enabled}
                                            onChange={handleFirewallChange}
                                            style={{
                                                opacity: 0,
                                                width: 0,
                                                height: 0
                                            }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            cursor: 'pointer',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: firewallForm.enabled ? colors.accent : (theme === 'light' ? '#d1d5db' : '#4b5563'),
                                            borderRadius: '28px',
                                            transition: 'background-color 0.3s ease',
                                            boxShadow: firewallForm.enabled
                                                ? (theme === 'light' ? '0 2px 4px rgba(34, 197, 94, 0.2)' : '0 2px 4px rgba(54, 226, 123, 0.3)')
                                                : 'none'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                height: '22px',
                                                width: '22px',
                                                left: firewallForm.enabled ? '26px' : '3px',
                                                bottom: '3px',
                                                backgroundColor: '#ffffff',
                                                borderRadius: '50%',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${colors.border}` }}>
                                <button
                                    type="button"
                                    onClick={closeFirewallModal}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: theme === 'light' ? '#ffffff' : 'transparent',
                                        color: colors.text,
                                        border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${colors.border}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = theme === 'light' ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = theme === 'light' ? '#ffffff' : 'transparent';
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={firewallLoading}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: colors.accent,
                                        color: theme === 'dark' ? '#121212' : '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: firewallLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        opacity: firewallLoading ? 0.6 : 1,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!firewallLoading) {
                                            e.target.style.backgroundColor = theme === 'light' ? '#1fa45a' : '#2dd47e';
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!firewallLoading) {
                                            e.target.style.backgroundColor = colors.accent;
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    {firewallLoading ? 'Saving...' : 'Save Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteRuleId && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10001
                }}>
                    <div style={{
                        backgroundColor: colors.bgCard,
                        color: colors.text,
                        padding: '24px',
                        borderRadius: '10px',
                        border: `1px solid ${colors.border}`,
                        width: '90%',
                        maxWidth: '420px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.35)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Delete Firewall Rule</h3>
                        <p style={{ marginTop: 0, marginBottom: '20px', color: colors.textMuted }}>
                            Are you sure you want to delete this rule? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => setConfirmDeleteRuleId(null)}
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: colors.bgPanel,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteRule}
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: colors.danger,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toasts */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 1500
            }}>
                {toasts.map((t) => (
                    <div key={t.id} style={{
                        minWidth: '260px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: t.type === 'error' ? colors.danger : t.type === 'success' ? colors.accent : colors.bgCard,
                        color: t.type === 'error' || t.type === 'success' ? '#fff' : colors.text,
                        border: `1px solid ${colors.border}`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}>
                        {t.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FirewallRuleManagement;

