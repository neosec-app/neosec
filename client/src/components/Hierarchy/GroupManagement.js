// src/components/Hierarchy/GroupManagement.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const GroupManagement = ({ user }) => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [newGroup, setNewGroup] = useState({
        name: '',
        description: '',
        maxMembers: 10
    });
    const [inviteEmail, setInviteEmail] = useState('');
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

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setError('');

        if (!newGroup.name.trim()) {
            setError('Group name is required');
            return;
        }

        try {
            const response = await hierarchyAPI.createGroup(newGroup);
            if (response.success) {
                setGroups([...groups, response.group]);
                setShowCreateModal(false);
                setNewGroup({ name: '', description: '', maxMembers: 10 });
            }
        } catch (error) {
            console.error('Create group error:', error);
            setError(error.message || 'Failed to create group');
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setError('');

        if (!inviteEmail.trim()) {
            setError('Email is required');
            return;
        }

        try {
            const response = await hierarchyAPI.inviteMember(selectedGroup.id, inviteEmail);
            if (response.success) {
                alert('Invitation sent successfully!');
                setShowInviteModal(false);
                setInviteEmail('');
                setSelectedGroup(null);
            }
        } catch (error) {
            console.error('Invite member error:', error);
            setError(error.message || 'Failed to send invitation');
        }
    };

    const viewGroupDetails = async (group) => {
        try {
            const response = await hierarchyAPI.getGroupDetails(group.id);
            if (response.success) {
                setSelectedGroup(response.group);
            }
        } catch (error) {
            console.error('Fetch group details error:', error);
            alert('Failed to load group details');
        }
    };

    if (user?.accountType !== 'leader') {
        return (
            <div className="min-h-screen bg-background-dark text-text-light flex items-center justify-center">
                <div className="text-center p-8 bg-form-background-dark rounded-lg border border-input-background-dark max-w-md">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold mb-2">Leader Access Required</h2>
                    <p className="text-text-muted mb-6">
                        You need to upgrade to a Leader account to create and manage groups.
                    </p>
                    <button
                        onClick={() => window.location.href = '#subscription'}
                        className="px-6 py-3 bg-primary text-background-dark rounded-lg font-semibold hover:bg-opacity-90"
                    >
                        Upgrade to Leader
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-dark text-text-light p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Groups</h1>
                        <p className="text-text-muted">
                            Manage your groups and team members
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-primary text-background-dark rounded-lg font-semibold hover:bg-opacity-90 transition-all"
                    >
                        + Create Group
                    </button>
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
                        <p>Loading groups...</p>
                    </div>
                ) : groups.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12 p-8 bg-form-background-dark rounded-lg border border-input-background-dark">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-bold mb-2">No Groups Yet</h3>
                        <p className="text-text-muted mb-6">
                            Create your first group to start inviting members and managing configurations.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-primary text-background-dark rounded-lg font-semibold hover:bg-opacity-90"
                        >
                            Create Your First Group
                        </button>
                    </div>
                ) : (
                    /* Groups Grid */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="p-6 bg-form-background-dark rounded-lg border border-input-background-dark hover:border-primary transition-all cursor-pointer"
                                onClick={() => viewGroupDetails(group)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                                        <p className="text-text-muted text-sm line-clamp-2">
                                            {group.description || 'No description'}
                                        </p>
                                    </div>
                                    {group.isActive && (
                                        <span className="px-2 py-1 bg-primary bg-opacity-20 text-primary text-xs font-semibold rounded">
                      Active
                    </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="text-text-muted">
                    <span className="text-text-light font-semibold">
                      {group.members?.length || 0}
                    </span>
                                        /{group.maxMembers} members
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedGroup(group);
                                            setShowInviteModal(true);
                                        }}
                                        className="px-3 py-1 bg-primary text-background-dark rounded text-xs font-semibold hover:bg-opacity-90"
                                    >
                                        Invite
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Group Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-form-background-dark rounded-lg border border-input-background-dark p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-6">Create New Group</h2>

                            <form onSubmit={handleCreateGroup}>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Group Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newGroup.name}
                                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-input-background-dark border border-input-background-dark rounded-lg focus:border-primary focus:outline-none text-text-light"
                                        placeholder="e.g., Engineering Team"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newGroup.description}
                                        onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-input-background-dark border border-input-background-dark rounded-lg focus:border-primary focus:outline-none text-text-light resize-none"
                                        placeholder="Brief description of the group"
                                        rows="3"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold mb-2">
                                        Max Members
                                    </label>
                                    <input
                                        type="number"
                                        value={newGroup.maxMembers}
                                        onChange={(e) => setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-input-background-dark border border-input-background-dark rounded-lg focus:border-primary focus:outline-none text-text-light"
                                        min="1"
                                        max="999"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setNewGroup({ name: '', description: '', maxMembers: 10 });
                                            setError('');
                                        }}
                                        className="flex-1 px-4 py-3 bg-input-background-dark text-text-light rounded-lg font-semibold hover:bg-opacity-80"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-primary text-background-dark rounded-lg font-semibold hover:bg-opacity-90"
                                    >
                                        Create Group
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Invite Member Modal */}
                {showInviteModal && selectedGroup && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-form-background-dark rounded-lg border border-input-background-dark p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold mb-2">Invite Member</h2>
                            <p className="text-text-muted mb-6">
                                Invite a user to join <span className="text-text-light font-semibold">{selectedGroup.name}</span>
                            </p>

                            <form onSubmit={handleInviteMember}>
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-input-background-dark border border-input-background-dark rounded-lg focus:border-primary focus:outline-none text-text-light"
                                        placeholder="user@example.com"
                                        required
                                    />
                                    <p className="text-text-muted text-xs mt-2">
                                        The user must have a NeoSec account to receive the invitation.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowInviteModal(false);
                                            setInviteEmail('');
                                            setSelectedGroup(null);
                                            setError('');
                                        }}
                                        className="flex-1 px-4 py-3 bg-input-background-dark text-text-light rounded-lg font-semibold hover:bg-opacity-80"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-primary text-background-dark rounded-lg font-semibold hover:bg-opacity-90"
                                    >
                                        Send Invitation
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Group Details Modal */}
                {selectedGroup && !showInviteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-form-background-dark rounded-lg border border-input-background-dark p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{selectedGroup.name}</h2>
                                    <p className="text-text-muted">{selectedGroup.description || 'No description'}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedGroup(null)}
                                    className="text-text-muted hover:text-text-light text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4">Group Statistics</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-input-background-dark rounded-lg">
                                        <p className="text-text-muted text-sm mb-1">Total Members</p>
                                        <p className="text-2xl font-bold text-primary">
                                            {selectedGroup.members?.length || 0}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-input-background-dark rounded-lg">
                                        <p className="text-text-muted text-sm mb-1">Available Slots</p>
                                        <p className="text-2xl font-bold text-primary">
                                            {selectedGroup.maxMembers - (selectedGroup.members?.length || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Members</h3>
                                    <button
                                        onClick={() => setShowInviteModal(true)}
                                        className="px-4 py-2 bg-primary text-background-dark rounded-lg text-sm font-semibold hover:bg-opacity-90"
                                    >
                                        + Invite Member
                                    </button>
                                </div>

                                {selectedGroup.members && selectedGroup.members.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedGroup.members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-4 bg-input-background-dark rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-semibold">{member.user?.email}</p>
                                                    <p className="text-text-muted text-sm">
                                                        Joined: {new Date(member.joinedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    member.status === 'accepted'
                                                        ? 'bg-primary bg-opacity-20 text-primary'
                                                        : 'bg-yellow-500 bg-opacity-20 text-yellow-500'
                                                }`}>
                          {member.status}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-text-muted">
                                        <p>No members yet. Invite some to get started!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupManagement;