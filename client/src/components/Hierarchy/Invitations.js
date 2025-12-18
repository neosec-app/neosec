import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Invitations = ({ theme, palette, isMobile, isTablet }) => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            setLoading(true);
            const response = await hierarchyAPI.getMyInvitations();
            if (response.success) {
                setInvitations(response.invitations || []);
            }
        } catch (error) {
            console.error('Fetch invitations error:', error);
            setError('Failed to load invitations');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (invitationId) => {
        try {
            const response = await hierarchyAPI.acceptInvitation(invitationId);
            if (response.success) {
                setInvitations(invitations.filter(inv => inv.id !== invitationId));
                alert('Invitation accepted! You are now a member of the group.');
            }
        } catch (error) {
            console.error('Accept invitation error:', error);
            alert('Failed to accept invitation: ' + (error.message || 'Unknown error'));
        }
    };

    const handleReject = async (invitationId) => {
        if (!window.confirm('Are you sure you want to reject this invitation?')) {
            return;
        }

        try {
            const response = await hierarchyAPI.rejectInvitation(invitationId);
            if (response.success) {
                setInvitations(invitations.filter(inv => inv.id !== invitationId));
                alert('Invitation rejected.');
            }
        } catch (error) {
            console.error('Reject invitation error:', error);
            alert('Failed to reject invitation: ' + (error.message || 'Unknown error'));
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

    return (
        <div style={{
            flex: 1,
            padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
            backgroundColor: palette.bgMain,
            color: palette.text,
            minHeight: '100vh'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '600', margin: '0 0 8px 0', color: palette.text }}>
                        My Invitations
                    </h1>
                    <p style={{ color: palette.textMuted, margin: 0 }}>
                        Group invitations you've received
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
                        <p>Loading invitations...</p>
                    </div>
                ) : invitations.length === 0 ? (
                    /* Empty State */
                    <div style={{
                        textAlign: 'center',
                        padding: isMobile ? '32px 16px' : '48px 32px',
                        backgroundColor: palette.bgCard,
                        borderRadius: '12px',
                        border: `1px solid ${palette.border}`
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: palette.text }}>
                            No Invitations
                        </h3>
                        <p style={{ color: palette.textMuted }}>
                            You don't have any pending group invitations at the moment.
                        </p>
                    </div>
                ) : (
                    /* Invitations List */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {invitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                style={{
                                    padding: isMobile ? '20px' : '24px',
                                    backgroundColor: palette.bgCard,
                                    borderRadius: '12px',
                                    border: `1px solid ${isExpired(invitation.expiresAt) ? palette.border : palette.accent}`,
                                    opacity: isExpired(invitation.expiresAt) ? 0.6 : 1
                                }}
                            >
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                        <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: palette.text }}>
                                            {invitation.group?.name}
                                        </h3>
                                        {!isExpired(invitation.expiresAt) && (
                                            <span style={{
                                                padding: '4px 12px',
                                                backgroundColor: theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : palette.accentSoft,
                                                color: palette.accent,
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                borderRadius: '12px',
                                                border: `1px solid ${palette.accent}`
                                            }}>
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ color: palette.textMuted, margin: '0 0 16px 0' }}>
                                        {invitation.group?.description || 'No description available'}
                                    </p>

                                    {/* Group Info */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: isMobile ? 'column' : 'row',
                                        gap: isMobile ? '8px' : '24px',
                                        marginBottom: '12px',
                                        fontSize: '14px'
                                    }}>
                                        <div>
                                            <span style={{ color: palette.textMuted }}>Leader: </span>
                                            <span style={{ color: palette.text, fontWeight: '600' }}>
                                                {invitation.group?.leader?.email}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ color: palette.textMuted }}>Invited by: </span>
                                            <span style={{ color: palette.text, fontWeight: '600' }}>
                                                {invitation.inviter?.email}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Time Remaining */}
                                    <div style={{ fontSize: '14px', color: isExpired(invitation.expiresAt) ? palette.danger : palette.textMuted }}>
                                        ⏱️ {getTimeRemaining(invitation.expiresAt)}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                                    {!isExpired(invitation.expiresAt) ? (
                                        <>
                                            <button
                                                onClick={() => handleReject(invitation.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 16px',
                                                    backgroundColor: theme === 'light' ? '#f3f4f6' : palette.bgPanel,
                                                    color: palette.text,
                                                    border: `1px solid ${palette.border}`,
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAccept(invitation.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 16px',
                                                    backgroundColor: palette.accent,
                                                    color: theme === 'dark' ? '#000' : '#fff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                Accept
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{
                                            padding: '10px 16px',
                                            backgroundColor: `${palette.danger}20`,
                                            color: palette.danger,
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                            border: `1px solid ${palette.danger}`
                                        }}>
                                            Expired
                                        </div>
                                    )}
                                </div>

                                {/* Dates */}
                                <div style={{
                                    marginTop: '16px',
                                    paddingTop: '16px',
                                    borderTop: `1px solid ${palette.border}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                    color: palette.textMuted
                                }}>
                                    <span>Received: {new Date(invitation.createdAt).toLocaleDateString()}</span>
                                    <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <div style={{
                    marginTop: '32px',
                    padding: isMobile ? '20px' : '24px',
                    backgroundColor: palette.bgCard,
                    borderRadius: '12px',
                    border: `1px solid ${palette.border}`
                }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: palette.text }}>
                        About Group Invitations
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: palette.textMuted }}>
                        <p style={{ margin: 0 }}>• Invitations expire after 7 days</p>
                        <p style={{ margin: 0 }}>• Accepting an invitation makes you a member of the group</p>
                        <p style={{ margin: 0 }}>• Group leaders can manage your security configurations</p>
                        <p style={{ margin: 0 }}>• You can leave a group at any time from the Memberships page</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invitations;