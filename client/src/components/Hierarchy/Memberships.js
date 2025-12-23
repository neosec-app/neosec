// src/components/Hierarchy/Memberships.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Memberships = () => {
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
        <div className="min-h-screen bg-background-dark text-text-light p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Memberships</h1>
                    <p className="text-text-muted">
                        Groups you're a member of
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
                        <p>Loading memberships...</p>
                    </div>
                ) : memberships.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12 p-8 bg-form-background-dark rounded-lg border border-input-background-dark">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-bold mb-2">No Memberships</h3>
                        <p className="text-text-muted mb-6">
                            You're not a member of any groups yet. Wait for an invitation from a group leader.
                        </p>
                    </div>
                ) : (
                    /* Memberships Grid */
                    <div className="grid md:grid-cols-2 gap-6">
                        {memberships.map((membership) => (
                            <div
                                key={membership.id}
                                className="p-6 bg-form-background-dark rounded-lg border border-input-background-dark hover:border-primary transition-all"
                            >
                                {/* Group Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2">{membership.group?.name}</h3>
                                        <p className="text-text-muted text-sm line-clamp-2 mb-3">
                                            {membership.group?.description || 'No description'}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-primary bg-opacity-20 text-primary text-xs font-semibold rounded-full">
                    Member
                  </span>
                                </div>

                                {/* Group Info */}
                                <div className="space-y-3 mb-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted">Leader:</span>
                                        <span className="text-text-light font-semibold">
                      {membership.group?.leader?.email}
                    </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted">Members:</span>
                                        <span className="text-text-light font-semibold">
                      {membership.group?.members?.length || 0} / {membership.group?.maxMembers}
                    </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted">Joined:</span>
                                        <span className="text-text-light">
                      {new Date(membership.joinedAt).toLocaleDateString()}
                    </span>
                                    </div>
                                </div>

                                {/* Permissions Notice */}
                                {membership.canLeaderManageConfigs && (
                                    <div className="mb-4 p-3 bg-input-background-dark rounded-lg border border-input-background-dark">
                                        <div className="flex items-start gap-2">
                                            <span className="text-primary text-sm">ℹ️</span>
                                            <p className="text-text-muted text-xs">
                                                The group leader can manage your security configurations.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={() => handleLeaveGroup(membership.id, membership.group?.name)}
                                    className="w-full py-2 bg-error-red bg-opacity-10 text-error-red rounded-lg font-semibold hover:bg-opacity-20 transition-all border border-error-red"
                                >
                                    Leave Group
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-8 p-6 bg-form-background-dark rounded-lg border border-input-background-dark">
                    <h3 className="text-lg font-semibold mb-3">About Group Memberships</h3>
                    <div className="grid md:grid-cols-2 gap-6 text-sm text-text-muted">
                        <div>
                            <h4 className="text-text-light font-semibold mb-2">Benefits</h4>
                            <ul className="space-y-1">
                                <li>• Shared security configurations</li>
                                <li>• Managed VPN and firewall rules</li>
                                <li>• Team collaboration features</li>
                                <li>• Centralized management</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-text-light font-semibold mb-2">Permissions</h4>
                            <ul className="space-y-1">
                                <li>• Leaders can update your configs</li>
                                <li>• You can still manage your own settings</li>
                                <li>• You can leave a group anytime</li>
                                <li>• View group activity logs</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                {memberships.length > 0 && (
                    <div className="mt-6 grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-form-background-dark rounded-lg border border-input-background-dark">
                            <p className="text-text-muted text-sm mb-1">Total Memberships</p>
                            <p className="text-2xl font-bold text-primary">{memberships.length}</p>
                        </div>
                        <div className="p-4 bg-form-background-dark rounded-lg border border-input-background-dark">
                            <p className="text-text-muted text-sm mb-1">Active Groups</p>
                            <p className="text-2xl font-bold text-primary">
                                {memberships.filter(m => m.group?.isActive).length}
                            </p>
                        </div>
                        <div className="p-4 bg-form-background-dark rounded-lg border border-input-background-dark">
                            <p className="text-text-muted text-sm mb-1">Oldest Membership</p>
                            <p className="text-2xl font-bold text-primary">
                                {memberships.length > 0
                                    ? Math.floor((new Date() - new Date(Math.min(...memberships.map(m => new Date(m.joinedAt))))) / (1000 * 60 * 60 * 24))
                                    : 0}d
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Memberships;