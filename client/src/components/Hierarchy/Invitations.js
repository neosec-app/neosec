// src/components/Hierarchy/Invitations.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Invitations = () => {
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
        <div className="min-h-screen bg-background-dark text-text-light p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Invitations</h1>
                    <p className="text-text-muted">
                        Group invitations you've received
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-error-red bg-opacity-10 border border-error-red rounded-lg text-error-red">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-12 text-text-muted">
                        <div className="text-4xl mb-4">⏳</div>
                        <p>Loading invitations...</p>
                    </div>
                ) : invitations.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12 p-8 bg-form-background-dark rounded-lg border border-input-background-dark">
                        <div className="text-6xl mb-4">📬</div>
                        <h3 className="text-xl font-bold mb-2">No Invitations</h3>
                        <p className="text-text-muted">
                            You don't have any pending group invitations at the moment.
                        </p>
                    </div>
                ) : (
                    /* Invitations List */
                    <div className="space-y-4">
                        {invitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className={`p-6 bg-form-background-dark rounded-lg border transition-all ${
                                    isExpired(invitation.expiresAt)
                                        ? 'border-input-background-dark opacity-60'
                                        : 'border-primary'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold">{invitation.group?.name}</h3>
                                            {!isExpired(invitation.expiresAt) && (
                                                <span className="px-3 py-1 bg-primary bg-opacity-20 text-primary text-xs font-semibold rounded-full">
                          New
                        </span>
                                            )}
                                        </div>
                                        <p className="text-text-muted mb-4">
                                            {invitation.group?.description || 'No description available'}
                                        </p>

                                        {/* Group Info */}
                                        <div className="flex items-center gap-6 text-sm mb-4">
                                            <div>
                                                <span className="text-text-muted">Leader: </span>
                                                <span className="text-text-light font-semibold">
                          {invitation.group?.leader?.email}
                        </span>
                                            </div>
                                            <div>
                                                <span className="text-text-muted">Invited by: </span>
                                                <span className="text-text-light font-semibold">
                          {invitation.inviter?.email}
                        </span>
                                            </div>
                                        </div>

                                        {/* Time Remaining */}
                                        <div className="flex items-center gap-2 text-sm">
                      <span className={`${
                          isExpired(invitation.expiresAt) ? 'text-error-red' : 'text-text-muted'
                      }`}>
                        ⏱️ {getTimeRemaining(invitation.expiresAt)}
                      </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {!isExpired(invitation.expiresAt) && (
                                        <div className="flex gap-3 ml-4">
                                            <button
                                                onClick={() => handleReject(invitation.id)}
                                                className="px-4 py-2 bg-input-background-dark text-text-light rounded-lg font-semibold hover:bg-opacity-80 transition-all"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAccept(invitation.id)}
                                                className="px-4 py-2 bg-primary text-background-dark rounded-lg font-semibold hover:bg-opacity-90 transition-all"
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
                <div className="mt-8 p-6 bg-form-background-dark rounded-lg border border-input-background-dark">
                    <h3 className="text-lg font-semibold mb-3">About Group Invitations</h3>
                    <div className="space-y-2 text-sm text-text-muted">
                        <p>• Invitations expire after 7 days</p>
                        <p>• Accepting an invitation makes you a member of the group</p>
                        <p>• Group leaders can manage your security configurations</p>
                        <p>• You can leave a group at any time from the Memberships page</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invitations;