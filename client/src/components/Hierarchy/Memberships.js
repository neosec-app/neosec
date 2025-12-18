import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Memberships = ({ theme, palette, isMobile, isTablet }) => {
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMemberships();
    }, []);

    const fetchMemberships = async () => {
        try {
            setLoading(true);
            const response = await hierarchyAPI.getMyMemberships();
            if (response.success) {
                setMemberships(response.memberships || []);
            }
        } catch (error) {
            console.error('Fetch memberships error:', error);
            setError('Failed to load memberships');
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

    return (
        <div style={{
            flex: 1,
            padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
            backgroundColor: palette.bgMain,
            color: palette.text,
            minHeight: '100vh'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '600', margin: '0 0 8px 0', color: palette.text }}>
                        My Memberships
                    </h1>
                    <p style={{ color: palette.textMuted, margin: 0 }}>
                        Groups you're a member of
                    </p>
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

                {/* Loading State */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: palette.textMuted }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                        <p>Loading memberships...</p>
                    </div>
                ) : memberships.length === 0 ? (
                    /* Empty State */
                    <div style={{
                        textAlign: 'center',
                        padding: isMobile ? '32px 16px' : '48px 32px',
                        backgroundColor: palette.bgCard,
                        borderRadius: '12px',
                        border: `1px solid ${palette.border}`
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: palette.text }}>
                            No Memberships
                        </h3>
                        <p style={{ color: palette.textMuted }}>
                            You're not a member of any groups yet. Wait for an invitation from a group leader.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Memberships Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                            gap: '24px',
                            marginBottom: '32px'
                        }}>
                            {memberships.map((membership) => (
                                <div
                                    key={membership.id}
                                    style={{
                                        padding: '24px',
                                        backgroundColor: palette.bgCard,
                                        borderRadius: '12px',
                                        border: `1px solid ${palette.border}`,
                                        transition: 'border-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.accent}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = palette.border}
                                >
                                    {/* Group Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0', color: palette.text }}>
                                                {membership.group?.name}
                                            </h3>
                                            <p style={{ color: palette.textMuted, fontSize: '14px', margin: 0 }}>
                                                {membership.group?.description || 'No description'}
                                            </p>
                                        </div>
                                        <span style={{
                                            padding: '4px 12px',
                                            backgroundColor: theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : palette.accentSoft,
                                            color: palette.accent,
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            borderRadius: '12px',
                                            border: `1px solid ${palette.accent}`,
                                            whiteSpace: 'nowrap'
                                        }}>
                                            Member
                                        </span>
                                    </div>

                                    {/* Group Info */}
                                    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: palette.textMuted }}>Leader:</span>
                                            <span style={{ color: palette.text, fontWeight: '600' }}>
                                                {membership.group?.leader?.email}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: palette.textMuted }}>Members:</span>
                                            <span style={{ color: palette.text, fontWeight: '600' }}>
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

                                    {/* Permissions Notice */}
                                    {membership.canLeaderManageConfigs && (
                                        <div style={{
                                            marginBottom: '16px',
                                            padding: '12px',
                                            backgroundColor: theme === 'light' ? '#f3f4f6' : palette.bgPanel,
                                            borderRadius: '8px',
                                            border: `1px solid ${palette.border}`,
                                            display: 'flex',
                                            gap: '8px'
                                        }}>
                                            <span style={{ color: palette.accent }}>ℹ️</span>
                                            <p style={{ color: palette.textMuted, fontSize: '12px', margin: 0 }}>
                                                The group leader can manage your security configurations.
                                            </p>
                                        </div>
                                    )}

                                    {/* Leave Button */}
                                    <button
                                        onClick={() => handleLeaveGroup(membership.id, membership.group?.name)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            backgroundColor: `${palette.danger}10`,
                                            color: palette.danger,
                                            border: `1px solid ${palette.danger}`,
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Leave Group
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Stats Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                            gap: '16px',
                            marginBottom: '32px'
                        }}>
                            <div style={{
                                padding: '16px',
                                backgroundColor: palette.bgCard,
                                borderRadius: '8px',
                                border: `1px solid ${palette.border}`
                            }}>
                                <p style={{ color: palette.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>Total Memberships</p>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: palette.accent, margin: 0 }}>
                                    {memberships.length}
                                </p>
                            </div>
                            <div style={{
                                padding: '16px',
                                backgroundColor: palette.bgCard,
                                borderRadius: '8px',
                                border: `1px solid ${palette.border}`
                            }}>
                                <p style={{ color: palette.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>Active Groups</p>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: palette.accent, margin: 0 }}>
                                    {memberships.filter(m => m.group?.isActive).length}
                                </p>
                            </div>
                            <div style={{
                                padding: '16px',
                                backgroundColor: palette.bgCard,
                                borderRadius: '8px',
                                border: `1px solid ${palette.border}`
                            }}>
                                <p style={{ color: palette.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>Oldest Membership</p>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: palette.accent, margin: 0 }}>
                                    {memberships.length > 0
                                        ? Math.floor((new Date() - new Date(Math.min(...memberships.map(m => new Date(m.joinedAt))))) / (1000 * 60 * 60 * 24))
                                        : 0}d
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Info Section */}
                <div style={{
                    padding: isMobile ? '20px' : '24px',
                    backgroundColor: palette.bgCard,
                    borderRadius: '12px',
                    border: `1px solid ${palette.border}`
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: palette.text }}>
                        About Group Memberships
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                        gap: '24px',
                        fontSize: '14px',
                        color: palette.textMuted
                    }}>
                        <div>
                            <h4 style={{ color: palette.text, fontWeight: '600', marginBottom: '8px' }}>Benefits</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                <li>Shared security configurations</li>
                                <li>Managed VPN and firewall rules</li>
                                <li>Team collaboration features</li>
                                <li>Centralized management</li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ color: palette.text, fontWeight: '600', marginBottom: '8px' }}>Permissions</h4>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                <li>Leaders can update your configs</li>
                                <li>You can still manage your own settings</li>
                                <li>You can leave a group anytime</li>
                                <li>View group activity logs</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Memberships;