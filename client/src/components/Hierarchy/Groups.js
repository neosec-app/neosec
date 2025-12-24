// src/components/Hierarchy/Groups.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Groups = ({ user, theme, palette, isMobile, isTablet }) => {
    const [ownedGroups, setOwnedGroups] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // overview, owned, member

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch owned groups if user is a leader
            if (user?.accountType === 'leader') {
                try {
                    const groupsResponse = await hierarchyAPI.getMyGroups();
                    if (groupsResponse.success) {
                        setOwnedGroups(groupsResponse.groups || []);
                    }
                } catch (groupsError) {
                    console.error('Fetch owned groups error:', groupsError);
                }
            }

            // Fetch memberships for all users
            try {
                const membershipsResponse = await hierarchyAPI.getMyMemberships();
                if (membershipsResponse.success) {
                    setMemberships(membershipsResponse.memberships || []);
                }
            } catch (membershipsError) {
                console.error('Fetch memberships error:', membershipsError);
            }

        } catch (error) {
            console.error('Fetch data error:', error);
            setError('Failed to load groups data');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveGroup = async (membershipId, groupName) => {
        if (!window.confirm(`Are you sure you want to leave "${groupName}"?`)) {
            return;
        }

        try {
            const response = await hierarchyAPI.leaveGroup(membershipId);
            if (response.success) {
                setMemberships(memberships.filter(m => m.id !== membershipId));
                alert('You have left the group successfully.');
            }
        } catch (error) {
            console.error('Leave group error:', error);
            alert('Failed to leave group: ' + (error.message || 'Unknown error'));
        }
    };

    const viewGroupDetails = async (group) => {
        try {
            const response = await hierarchyAPI.getGroupDetails(group.id);
            if (response.success) {
                alert(`Group: ${response.group.name}\nMembers: ${response.group.members?.length || 0}`);
            }
        } catch (error) {
            console.error('Fetch group details error:', error);
            alert('Failed to load group details');
        }
    };

    const renderOwnedGroups = () => (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: palette.text }}>
                Groups I Manage
            </h2>

            {ownedGroups.length === 0 ? (
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
                    {ownedGroups.map((group) => (
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
        </div>
    );

    const renderMemberships = () => (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: palette.text }}>
                Groups I'm Member Of
            </h2>

            {memberships.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: isMobile ? '32px 16px' : '48px 32px',
                    backgroundColor: palette.bgCard,
                    borderRadius: '12px',
                    border: `1px solid ${palette.border}`
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: palette.text }}>
                        No Group Memberships
                    </h3>
                    <p style={{ color: palette.textMuted, marginBottom: '24px' }}>
                        You're not a member of any groups yet. Ask a group leader to invite you!
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: '24px'
                }}>
                    {memberships.map((membership) => (
                        <div
                            key={membership.id}
                            style={{
                                padding: '24px',
                                backgroundColor: palette.bgCard,
                                borderRadius: '12px',
                                border: `1px solid ${palette.border}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: palette.text }}>
                                    {membership.group?.name || 'Unknown Group'}
                                </h3>
                                <span style={{
                                    padding: '4px 8px',
                                    backgroundColor: theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : palette.accentSoft,
                                    color: palette.accent,
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    borderRadius: '4px',
                                    border: `1px solid ${palette.accent}`
                                }}>
                                    Member
                                </span>
                            </div>
                            <p style={{ color: palette.textMuted, fontSize: '14px', marginBottom: '16px' }}>
                                {membership.group?.description || 'No description'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: palette.textMuted, fontSize: '14px' }}>
                                    Role: <span style={{ color: palette.text, fontWeight: '600' }}>
                                        {membership.role || 'Member'}
                                    </span>
                                </span>
                                <button
                                    onClick={() => handleLeaveGroup(membership.id, membership.group?.name)}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: palette.danger,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Leave
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // If user is not a leader and has no memberships, show upgrade prompt
    if (user?.accountType !== 'leader' && memberships.length === 0 && !loading) {
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
                        Join Groups to Get Started
                    </h2>
                    <p style={{ color: palette.textMuted, marginBottom: '24px' }}>
                        You're not a member of any groups yet. Ask a group leader to invite you, or upgrade to become a leader yourself!
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
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
                            Manage your groups and memberships
                        </p>
                    </div>
                    {user?.accountType === 'leader' && (
                        <button
                            onClick={() => {
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
                    )}
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

                {/* Tab Navigation for Leaders */}
                {user?.accountType === 'leader' && (ownedGroups.length > 0 || memberships.length > 0) && (
                    <div style={{
                        display: 'flex',
                        marginBottom: '24px',
                        borderBottom: `1px solid ${palette.border}`,
                        gap: '24px'
                    }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            style={{
                                padding: '12px 0',
                                border: 'none',
                                borderBottom: activeTab === 'overview' ? `2px solid ${palette.accent}` : 'none',
                                backgroundColor: 'transparent',
                                color: activeTab === 'overview' ? palette.accent : palette.textMuted,
                                fontWeight: activeTab === 'overview' ? '600' : '500',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Overview ({ownedGroups.length + memberships.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('owned')}
                            style={{
                                padding: '12px 0',
                                border: 'none',
                                borderBottom: activeTab === 'owned' ? `2px solid ${palette.accent}` : 'none',
                                backgroundColor: 'transparent',
                                color: activeTab === 'owned' ? palette.accent : palette.textMuted,
                                fontWeight: activeTab === 'owned' ? '600' : '500',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Managing ({ownedGroups.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('member')}
                            style={{
                                padding: '12px 0',
                                border: 'none',
                                borderBottom: activeTab === 'member' ? `2px solid ${palette.accent}` : 'none',
                                backgroundColor: 'transparent',
                                color: activeTab === 'member' ? palette.accent : palette.textMuted,
                                fontWeight: activeTab === 'member' ? '600' : '500',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            Member Of ({memberships.length})
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: palette.textMuted }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                        <p>Loading groups...</p>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab - Show both owned and member groups */}
                        {activeTab === 'overview' && user?.accountType === 'leader' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                                {ownedGroups.length > 0 && renderOwnedGroups()}
                                {memberships.length > 0 && renderMemberships()}
                                {ownedGroups.length === 0 && memberships.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '48px 0', color: palette.textMuted }}>
                                        <p>You don't have any groups yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Owned Groups Tab */}
                        {activeTab === 'owned' && renderOwnedGroups()}

                        {/* Memberships Tab */}
                        {activeTab === 'member' && renderMemberships()}

                        {/* Default view for non-leaders */}
                        {user?.accountType !== 'leader' && renderMemberships()}
                    </>
                )}
            </div>
        </div>
    );
};

export default Groups;
