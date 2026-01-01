// src/components/Hierarchy/Invitations.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Invitations = ({ theme, palette }) => {
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
                // Remove invitation from list
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
                // Remove invitation from list
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
            minHeight: '100vh',
            backgroundColor: palette.bgMain,
            color: palette.text,
            padding: '40px'
        }}>
            <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '600',
                        margin: '0 0 8px 0',
                        color: palette.text
                    }}>
                        My Invitations
                    </h1>
                    <p style={{
                        color: palette.textMuted,
                        margin: 0,
                        fontSize: '16px'
                    }}>
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
                    <div style={{
                        textAlign: 'center',
                        padding: '48px 0',
                        color: palette.textMuted
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '16px'
                        }}>⏳</div>
                        <p style={{ margin: 0 }}>Loading invitations...</p>
                    </div>
                ) : invitations.length === 0 ? (
                    /* Empty State */
                    <div style={{
                        textAlign: 'center',
                        padding: '48px 32px',
                        backgroundColor: palette.bgCard,
                        borderRadius: '12px',
                        border: `1px solid ${palette.border}`
                    }}>
                        <div style={{
                            fontSize: '72px',
                            marginBottom: '16px'
                        }}>📬</div>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: '0 0 8px 0',
                            color: palette.text
                        }}>
                            No Invitations
                        </h3>
                        <p style={{
                            color: palette.textMuted,
                            margin: 0
                        }}>
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
                                    padding: '24px',
                                    backgroundColor: palette.bgCard,
                                    borderRadius: '12px',
                                    border: `1px solid ${isExpired(invitation.expiresAt) ? palette.border : palette.accent}`,
                                    opacity: isExpired(invitation.expiresAt) ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '8px'
                                        }}>
                                            <h3 style={{
                                                fontSize: '20px',
                                                fontWeight: '600',
                                                color: palette.text,
                                                margin: 0
                                            }}>
                                                {invitation.group?.name}
                                            </h3>
                                            {!isExpired(invitation.expiresAt) && (
                                                <span style={{
                                                    padding: '4px 12px',
                                                    backgroundColor: `${palette.accent}20`,
                                                    color: palette.accent,
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    borderRadius: '999px'
                                                }}>
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <p style={{
                                            color: palette.textMuted,
                                            margin: '0 0 16px 0',
                                            fontSize: '14px'
                                        }}>
                                            {invitation.group?.description || 'No description available'}
                                        </p>

                                        {/* Group Info */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '24px',
                                            fontSize: '14px',
                                            marginBottom: '16px'
                                        }}>
                                            <div>
                                                <span style={{ color: palette.textMuted }}>Leader: </span>
                                                <span style={{
                                                    color: palette.text,
                                                    fontWeight: '600'
                                                }}>
                                                    {invitation.group?.leader?.email}
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ color: palette.textMuted }}>Invited by: </span>
                                                <span style={{
                                                    color: palette.text,
                                                    fontWeight: '600'
                                                }}>
                                                    {invitation.inviter?.email}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Time Remaining */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px'
                                        }}>
                                            <span style={{
                                                color: isExpired(invitation.expiresAt) ? palette.danger : palette.textMuted
                                            }}>
                                                ⏱️ {getTimeRemaining(invitation.expiresAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {!isExpired(invitation.expiresAt) && (
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            marginLeft: '16px'
                                        }}>
                                            <button
                                                onClick={() => handleReject(invitation.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: 'transparent',
                                                    color: palette.text,
                                                    border: `1px solid ${palette.border}`,
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.backgroundColor = palette.danger;
                                                    e.target.style.color = '#fff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.backgroundColor = 'transparent';
                                                    e.target.style.color = palette.text;
                                                }}
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAccept(invitation.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: palette.accent,
                                                    color: theme === 'dark' ? '#000' : '#fff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.opacity = '0.8';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.opacity = '1';
                                                }}
                                            >
                                                Accept
                                            </button>
                                        </div>
                                    )}

                                    {isExpired(invitation.expiresAt) && (
                                        <div className="ml-4">
                      <span className="px-4 py-2 bg-error-red bg-opacity-20 text-error-red rounded-lg font-semibold">
                        Expired
                      </span>
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-input-background-dark pt-4">
                                    <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>
                      Received: {new Date(invitation.createdAt).toLocaleDateString()}
                    </span>
                                        <span>
                      Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <div style={{
                    marginTop: '32px',
                    padding: '24px',
                    backgroundColor: palette.bgCard,
                    borderRadius: '12px',
                    border: `1px solid ${palette.border}`
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 12px 0',
                        color: palette.text
                    }}>
                        About Group Invitations
                    </h3>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '14px',
                        color: palette.textMuted
                    }}>
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