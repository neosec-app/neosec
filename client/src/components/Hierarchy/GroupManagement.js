import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const GroupManagement = ({ user, theme, palette, isMobile, isTablet }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.accountType === 'leader') {
            fetchGroups();
        }
    }, [user]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await hierarchyAPI.getMyGroups();
            if (response.success) {
                setGroups(response.groups || []);
            }
        } catch (error) {
            console.error('Fetch groups error:', error);
            setError('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };


    const viewGroupDetails = async (group) => {
        try {
            const response = await hierarchyAPI.getGroupDetails(group.id);
            if (response.success) {
                // TODO: Display group details in a modal or separate view
                alert(`Group: ${response.group.name}\nMembers: ${response.group.members?.length || 0}`);
            }
        } catch (error) {
            console.error('Fetch group details error:', error);
            alert('Failed to load group details');
        }
    };

    if (user?.accountType !== 'leader') {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: palette.bgMain,
                color: palette.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '16px' : '32px'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: isMobile ? '24px' : '32px',
                    backgroundColor: palette.bgCard,
                    borderRadius: '12px',
                    border: `1px solid ${palette.border}`,
                    maxWidth: '500px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: palette.text }}>
                        Leader Access Required
                    </h2>
                    <p style={{ color: palette.textMuted, marginBottom: '24px' }}>
                        You need to upgrade to a Leader account to create and manage groups.
                    </p>
                    <button
                        onClick={() => window.location.href = '#subscription'}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: palette.accent,
                            color: theme === 'dark' ? '#000' : '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Upgrade to Leader
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            flex: 1,
            padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
            backgroundColor: palette.bgMain,
            color: palette.text,
            minHeight: '100vh'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    marginBottom: '32px',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '16px'
                }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '600', margin: '0 0 8px 0', color: palette.text }}>
                            My Groups
                        </h1>
                        <p style={{ color: palette.textMuted, margin: 0 }}>
                            Manage your groups and team members
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            // TODO: Implement create group modal
                            alert('Create group functionality coming soon');
                        }}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: palette.accent,
                            color: theme === 'dark' ? '#000' : '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            width: isMobile ? '100%' : 'auto'
                        }}
                    >
                        + Create Group
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: `${palette.danger}20`,
                        border: `1px solid ${palette.danger}`,
                        borderRadius: '8px',
                        color: palette.danger
                    }}>
                        {error}
                    </div>
                )}

                {/* Loading/Empty/Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: palette.textMuted }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                        <p>Loading groups...</p>
                    </div>
                ) : groups.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: isMobile ? '32px 16px' : '48px 32px',
                        backgroundColor: palette.bgCard,
                        borderRadius: '12px',
                        border: `1px solid ${palette.border}`
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: palette.text }}>
                            No Groups Yet
                        </h3>
                        <p style={{ color: palette.textMuted, marginBottom: '24px' }}>
                            Create your first group to start inviting members and managing configurations.
                        </p>
                        <button
                            onClick={() => {
                                // TODO: Implement create group modal
                                alert('Create group functionality coming soon');
                            }}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: palette.accent,
                                color: theme === 'dark' ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Create Your First Group
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                        gap: '24px'
                    }}>
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                onClick={() => viewGroupDetails(group)}
                                style={{
                                    padding: '24px',
                                    backgroundColor: palette.bgCard,
                                    borderRadius: '12px',
                                    border: `1px solid ${palette.border}`,
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: palette.text }}>
                                        {group.name}
                                    </h3>
                                    {group.isActive && (
                                        <span style={{
                                            padding: '4px 8px',
                                            backgroundColor: theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : palette.accentSoft,
                                            color: palette.accent,
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            borderRadius: '4px',
                                            border: `1px solid ${palette.accent}`
                                        }}>
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p style={{ color: palette.textMuted, fontSize: '14px', marginBottom: '16px' }}>
                                    {group.description || 'No description'}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: palette.textMuted, fontSize: '14px' }}>
                                        <span style={{ color: palette.text, fontWeight: '600' }}>
                                            {group.members?.length || 0}
                                        </span>
                                        /{group.maxMembers} members
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Implement invite member modal
                                            alert('Invite member functionality coming soon');
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: palette.accent,
                                            color: theme === 'dark' ? '#000' : '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Invite
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modals would go here - Create Group, Invite Member, Group Details */}
                {/* Implementation continues with modals styled similarly */}
            </div>
        </div>
    );
};

export default GroupManagement;