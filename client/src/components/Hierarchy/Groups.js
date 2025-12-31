// src/components/Hierarchy/Groups.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Groups = ({ user, theme, palette, isMobile, isTablet }) => {
    const [ownedGroups, setOwnedGroups] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('owned'); // owned, member
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedGroupForInvite, setSelectedGroupForInvite] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [invitations, setInvitations] = useState([]);

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
                console.error('Fetch memberships error:', membershipsError || 'Unknown error');
            }

            // Fetch invitations for all users
            try {
                const invitationsResponse = await hierarchyAPI.getMyInvitations();
                if (invitationsResponse.success) {
                    setInvitations(invitationsResponse.invitations || []);
                }
            } catch (invitationsError) {
                console.error('Fetch invitations error:', invitationsError || 'Unknown error');
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
            console.error('Fetch group details error:', error || 'Unknown error');
            alert('Failed to load group details');
        }
    };

    const handleInviteMember = async (group) => {
        setSelectedGroupForInvite(group);
        setInviteModalOpen(true);
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) {
            alert('Please enter an email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inviteEmail.trim())) {
            alert('Please enter a valid email address');
            return;
        }

        setInviteLoading(true);
        try {
            const response = await hierarchyAPI.inviteMember(selectedGroupForInvite.id, inviteEmail.trim());
            if (response.success) {
                alert(`Invitation sent to ${inviteEmail.trim()} successfully!`);
                setInviteModalOpen(false);
                setInviteEmail('');
                setSelectedGroupForInvite(null);
            } else {
                alert(response.message || 'Failed to send invitation');
            }
        } catch (error) {
            console.error('Invite member error:', error || 'Unknown error');
            alert('Failed to send invitation: ' + (error?.message || 'Unknown error'));
        } finally {
            setInviteLoading(false);
        }
    };

    const handleAcceptInvitation = async (invitationId) => {
        try {
            const response = await hierarchyAPI.acceptInvitation(invitationId);
            if (response.success) {
                // Remove invitation from list and refresh data
                setInvitations(invitations.filter(inv => inv.id !== invitationId));
                await fetchAllData(); // Refresh to get updated memberships
                alert('Invitation accepted! You are now a member of the group.');
            }
        } catch (error) {
            console.error('Accept invitation error:', error || 'Unknown error');
            alert('Failed to accept invitation: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleRejectInvitation = async (invitationId) => {
        if (!window.confirm('Are you sure you want to reject this invitation?')) {
            return;
        }

        try {
            const response = await hierarchyAPI.rejectInvitation(invitationId);
            if (response.success) {
                // Remove invitation from list
                setInvitations(invitations.filter(inv => inv.id !== invitationId));
                alert('Invitation rejected.');
            }
        } catch (error) {
            console.error('Reject invitation error:', error || 'Unknown error');
            alert('Failed to reject invitation: ' + (error?.message || 'Unknown error'));
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
            console.error('Leave group error:', error || 'Unknown error');
            alert('Failed to leave group: ' + (error?.message || 'Unknown error'));
        }
    };

    const isExpired = (expiresAt) => {
        return new Date(expiresAt) < new Date();
    };

    const getTimeRemaining = (expiresAt) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;

        if (diff <= 0) return 'Expired';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
        return 'Expires soon';
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
                            alert('ℹ️ This tab shows groups you\'re a member of.\n\nTo create your own groups, leaders can use the "My Groups" section.');
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
                                        handleInviteMember(group);
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
                {user?.accountType === 'leader' && (ownedGroups.length > 0 || memberships.length > 0) ? (
                    <div style={{
                        display: 'flex',
                        marginBottom: '24px',
                        borderBottom: `1px solid ${palette.border}`,
                        gap: '24px'
                    }}>
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
                        {/* Owned Groups Tab */}
                        {activeTab === 'owned' && renderOwnedGroups()}

                        {/* Memberships Tab */}
                        {activeTab === 'member' && renderMemberships()}

                        {/* Default view for non-leaders */}
                        {user?.accountType !== 'leader' && renderMemberships()}

                        {/* Default view for leaders with no tabs shown */}
                        {user?.accountType === 'leader' && ownedGroups.length === 0 && memberships.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '48px 0', color: palette.textMuted }}>
                                <p>You don't have any groups yet.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Pending Invitations Section */}
                {invitations.length > 0 && (
                    <div style={{
                        marginTop: '32px',
                        padding: '24px',
                        backgroundColor: palette.bgCard,
                        borderRadius: '12px',
                        border: `1px solid ${palette.border}`
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: palette.text
                        }}>
                            Pending Invitations ({invitations.length})
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {invitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    style={{
                                        padding: '20px',
                                        backgroundColor: palette.bgMain,
                                        borderRadius: '8px',
                                        border: `1px solid ${
                                            isExpired(invitation.expiresAt)
                                                ? palette.danger
                                                : palette.accent + '40'
                                        }`,
                                        opacity: isExpired(invitation.expiresAt) ? 0.7 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <h4 style={{
                                                    fontSize: '18px',
                                                    fontWeight: '600',
                                                    margin: 0,
                                                    color: palette.text
                                                }}>
                                                    {invitation.group?.name}
                                                </h4>
                                                {!isExpired(invitation.expiresAt) && (
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: palette.accentSoft,
                                                        color: palette.accent,
                                                        fontSize: '11px',
                                                        fontWeight: '600',
                                                        borderRadius: '4px'
                                                    }}>
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{
                                                color: palette.textMuted,
                                                fontSize: '14px',
                                                marginBottom: '12px'
                                            }}>
                                                {invitation.group?.description || 'No description available'}
                                            </p>

                                            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', marginBottom: '8px' }}>
                                                <div>
                                                    <span style={{ color: palette.textMuted }}>Leader: </span>
                                                    <span style={{ color: palette.text, fontWeight: '500' }}>
                                                        {invitation.group?.leader?.email}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span style={{ color: palette.textMuted }}>Invited by: </span>
                                                    <span style={{ color: palette.text, fontWeight: '500' }}>
                                                        {invitation.inviter?.email}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{
                                                fontSize: '13px',
                                                color: isExpired(invitation.expiresAt) ? palette.danger : palette.textMuted
                                            }}>
                                                ⏱️ {getTimeRemaining(invitation.expiresAt)}
                                            </div>
                                        </div>

                                        {!isExpired(invitation.expiresAt) ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleRejectInvitation(invitation.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: palette.bgMain,
                                                        color: palette.textMuted,
                                                        border: `1px solid ${palette.border}`,
                                                        borderRadius: '6px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAcceptInvitation(invitation.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: palette.accent,
                                                        color: theme === 'dark' ? '#000' : '#fff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Accept
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{
                                                padding: '8px 16px',
                                                backgroundColor: palette.danger + '20',
                                                color: palette.danger,
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                fontSize: '13px'
                                            }}>
                                                Expired
                                            </span>
                                        )}
                                    </div>

                                    <div style={{
                                        borderTop: `1px solid ${palette.border}`,
                                        paddingTop: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '12px',
                                        color: palette.textMuted
                                    }}>
                                        <span>
                                            Received: {new Date(invitation.createdAt).toLocaleDateString()}
                                        </span>
                                        <span>
                                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Memberships Section */}
                {memberships.length > 0 && (
                    <div style={{
                        marginTop: '32px',
                        padding: '24px',
                        backgroundColor: palette.bgCard,
                        borderRadius: '12px',
                        border: `1px solid ${palette.border}`
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: palette.text
                        }}>
                            My Memberships ({memberships.length})
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '16px'
                        }}>
                            {memberships.map((membership) => (
                                <div
                                    key={membership.id}
                                    style={{
                                        padding: '20px',
                                        backgroundColor: palette.bgMain,
                                        borderRadius: '8px',
                                        border: `1px solid ${palette.border}`
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{
                                                fontSize: '18px',
                                                fontWeight: '600',
                                                margin: '0 0 8px 0',
                                                color: palette.text
                                            }}>
                                                {membership.group?.name}
                                            </h4>
                                            <p style={{
                                                color: palette.textMuted,
                                                fontSize: '14px',
                                                marginBottom: '12px',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {membership.group?.description || 'No description'}
                                            </p>
                                        </div>
                                        <span style={{
                                            padding: '4px 8px',
                                            backgroundColor: palette.accentSoft,
                                            color: palette.accent,
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            borderRadius: '4px'
                                        }}>
                                            Member
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        fontSize: '13px',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: palette.textMuted }}>Leader:</span>
                                            <span style={{ color: palette.text, fontWeight: '500' }}>
                                                {membership.group?.leader?.email}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: palette.textMuted }}>Members:</span>
                                            <span style={{ color: palette.text, fontWeight: '500' }}>
                                                {membership.group?.members?.length || 0} / {membership.group?.maxMembers}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: palette.textMuted }}>Joined:</span>
                                            <span style={{ color: palette.text }}>
                                                {new Date(membership.joinedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {membership.canLeaderManageConfigs && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: palette.bgCard,
                                            borderRadius: '6px',
                                            border: `1px solid ${palette.border}`,
                                            marginBottom: '16px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                <span style={{ color: palette.accent, fontSize: '14px' }}>ℹ️</span>
                                                <p style={{
                                                    color: palette.textMuted,
                                                    fontSize: '12px',
                                                    margin: 0
                                                }}>
                                                    The group leader can manage your security configurations.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleLeaveGroup(membership.id, membership.group?.name)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: palette.danger + '20',
                                            color: palette.danger,
                                            border: `1px solid ${palette.danger}`,
                                            borderRadius: '6px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Leave Group
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Invite Member Modal */}
                {inviteModalOpen && selectedGroupForInvite && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: isMobile ? '16px' : '32px'
                    }}>
                        <div style={{
                            backgroundColor: palette.bgCard,
                            borderRadius: '12px',
                            padding: '24px',
                            border: `1px solid ${palette.border}`,
                            maxWidth: '400px',
                            width: '100%'
                        }}>
                            <h3 style={{
                                margin: '0 0 16px 0',
                                color: palette.text,
                                fontSize: '20px',
                                fontWeight: '600'
                            }}>
                                Invite Member to {selectedGroupForInvite.name}
                            </h3>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: palette.text,
                                    fontWeight: '500',
                                    fontSize: '14px'
                                }}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        border: `1px solid ${palette.border}`,
                                        backgroundColor: palette.bgMain,
                                        color: palette.text,
                                        fontSize: '14px'
                                    }}
                                    disabled={inviteLoading}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    onClick={() => {
                                        setInviteModalOpen(false);
                                        setInviteEmail('');
                                        setSelectedGroupForInvite(null);
                                    }}
                                    disabled={inviteLoading}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: 'transparent',
                                        color: palette.textMuted,
                                        border: `1px solid ${palette.border}`,
                                        borderRadius: '8px',
                                        fontWeight: '500',
                                        cursor: inviteLoading ? 'not-allowed' : 'pointer',
                                        opacity: inviteLoading ? 0.6 : 1
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendInvite}
                                    disabled={inviteLoading}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: inviteLoading ? palette.textMuted : palette.accent,
                                        color: theme === 'dark' ? '#000' : '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: inviteLoading ? 'not-allowed' : 'pointer',
                                        opacity: inviteLoading ? 0.6 : 1
                                    }}
                                >
                                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Groups;
