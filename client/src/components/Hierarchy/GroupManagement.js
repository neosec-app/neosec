import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const GroupManagement = ({ user, theme, palette, isMobile, isTablet }) => {
    console.log('GroupManagement component rendered with user:', user);

    // Check if user should be a leader based on localStorage
    const checkStoredUserStatus = () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                return parsedUser?.accountType === 'leader';
            } catch (error) {
                console.error('Error parsing stored user:', error || 'Unknown error');
            }
        }
        return false;
    };
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        emails: ['']
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [forceRefresh, setForceRefresh] = useState(0);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedGroupForInvite, setSelectedGroupForInvite] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);

    // Refresh user data on component mount and when user prop changes
    useEffect(() => {
        console.log('GroupManagement useEffect - user:', user);
        console.log('User accountType:', user?.accountType);

        // Always try to refresh user data from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('Stored user accountType:', parsedUser?.accountType);
                if (parsedUser?.accountType === 'leader') {
                    console.log('User is leader from stored data, fetching groups...');
                    fetchGroups();
                    return;
                }
            } catch (error) {
                console.error('Error parsing stored user:', error || 'Unknown error');
            }
        }

        // Fallback to prop user
        if (user?.accountType === 'leader') {
            console.log('User is leader from props, fetching groups...');
            fetchGroups();
        } else {
            console.log('User is not leader, skipping group fetch');
        }
    }, [user, forceRefresh]);

    const refreshUserData = () => {
        console.log('Refreshing user data...');
        setForceRefresh(prev => prev + 1);
    };

    const fetchGroups = async () => {
        try {
            console.log('Fetching groups...');
            setLoading(true);
            const response = await hierarchyAPI.getMyGroups();
            console.log('Groups response:', response);
            if (response.success) {
                setGroups(response.groups || []);
                console.log('Groups loaded:', response.groups?.length || 0);
            } else {
                console.error('Groups API returned error:', response?.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Fetch groups error:', error || 'Unknown error');
            console.error('Error details:', error?.response?.data || 'No error details');
            const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
            setError('Failed to load groups: ' + errorMessage);
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
            console.error('Fetch group details error:', error || 'Unknown error');
            console.error('Error details:', error?.message || 'No error message');
            alert('Failed to load group details: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        console.log('handleCreateGroup called with form:', createForm);
        console.log('Current user:', user);

        if (!createForm.name.trim()) {
            alert('Group name is required');
            return;
        }

        setCreateLoading(true);
        try {
            console.log('Form validation passed, preparing API call...');
            const groupData = {
                name: createForm.name.trim(),
                description: createForm.description.trim()
            };
            console.log('Group data to send:', groupData);
            console.log('Calling hierarchyAPI.createGroup...');

            const response = await hierarchyAPI.createGroup(groupData);
            console.log('Raw API response received:', response);
            console.log('API response success:', response?.success);
            console.log('API response group:', response?.group);

            if (response.success) {
                console.log('Group created:', response.group);

                // Send invitations to valid emails
                const validEmails = createForm.emails.filter(email => email.trim() !== '');
                if (validEmails.length > 0) {
                    console.log('Sending invitations to:', validEmails);
                    for (const email of validEmails) {
                        try {
                            await hierarchyAPI.inviteMember(response.group.id, email.trim());
                            console.log('Invitation sent to:', email);
                        } catch (inviteError) {
                            console.error('Failed to invite:', email, inviteError || 'Unknown invite error');
                        }
                    }
                }

                console.log('Group created successfully');
                setShowCreateModal(false);
                setCreateForm({ name: '', description: '', emails: [''] });
                await fetchGroups(); // Refresh the groups list
                alert(`Group created successfully!${validEmails.length > 0 ? ` ${validEmails.length} invitation(s) sent.` : ''}`);
            } else {
                console.error('API returned success=false:', response?.message || 'No message provided');
                alert(response.message || 'Failed to create group');
            }
        } catch (error) {
            console.error('Create group error:', error || 'Unknown error');
            console.error('Error response:', error?.response || 'No response');
            console.error('Error data:', error?.response?.data || 'No error data');
            let errorMessage = 'Failed to create group';

            try {
                if (error?.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error?.message) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                }
            } catch (parseError) {
                console.error('Error parsing error message:', parseError);
                errorMessage = 'Failed to create group';
            }

            alert('Error: ' + errorMessage);
        } finally {
            setCreateLoading(false);
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
                // Refresh the groups list to show updated member count
                await fetchGroups();
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

    const handleCreateFormChange = (e) => {
        const { name, value } = e.target;
        setCreateForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEmailChange = (index, value) => {
        const newEmails = [...createForm.emails];
        newEmails[index] = value;
        setCreateForm(prev => ({
            ...prev,
            emails: newEmails
        }));
    };

    const addEmailField = () => {
        setCreateForm(prev => ({
            ...prev,
            emails: [...prev.emails, '']
        }));
    };

    const removeEmailField = (index) => {
        if (createForm.emails.length > 1) {
            const newEmails = createForm.emails.filter((_, i) => i !== index);
            setCreateForm(prev => ({
                ...prev,
                emails: newEmails
            }));
        }
    };

    // Check both prop user and stored user
    const isStoredUserLeader = checkStoredUserStatus();
    const isUserLeader = user?.accountType === 'leader' || isStoredUserLeader;

    console.log('User leader check - prop user:', user?.accountType, 'stored user leader:', isStoredUserLeader, 'final result:', isUserLeader);

    if (!isUserLeader) {
        console.log('User is not a leader, showing access required screen');
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
                        You need to be a Leader account to create and manage groups. Upgrade your account to access these features.
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
                            Manage your groups and team members • Click "+ Create Group" to create new groups
                        </p>
                        <button
                            onClick={refreshUserData}
                            style={{
                                marginTop: '8px',
                                padding: '4px 8px',
                                backgroundColor: palette.accent,
                                color: theme === 'dark' ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Refresh Status
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            console.log('Create Group button clicked - setting showCreateModal to true');
                            setShowCreateModal(true);
                            console.log('showCreateModal should now be true');
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
                            width: isMobile ? '100%' : 'auto',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
                        {/* <p style={{ color: palette.textMuted, marginBottom: '24px' }}>
                            Create your first group to start inviting members and managing configurations.
                        </p> */}
                        {/* <button
                                    onClick={() => setShowCreateModal(true)}
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
                        </button> */}
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

                {/* Create Group Modal */}
                {showCreateModal && (
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
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: theme === 'light' ? '#fff' : palette.bgCard,
                            padding: '32px',
                            borderRadius: '12px',
                            border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`,
                            width: '90%',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ margin: 0, color: palette.text, fontSize: '24px', fontWeight: '600' }}>
                                    Create New Group
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: palette.textMuted,
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleCreateGroup}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: palette.text,
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}>
                                        Group Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={createForm.name}
                                        onChange={handleCreateFormChange}
                                        placeholder="Enter group name"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: `1px solid ${palette.border}`,
                                            borderRadius: '8px',
                                            backgroundColor: theme === 'light' ? '#fff' : palette.bgPanel,
                                            color: palette.text,
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '8px',
                                        color: palette.text,
                                        fontWeight: '500',
                                        fontSize: '14px'
                                    }}>
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={createForm.description}
                                        onChange={handleCreateFormChange}
                                        placeholder="Enter group description (optional)"
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: `1px solid ${palette.border}`,
                                            borderRadius: '8px',
                                            backgroundColor: theme === 'light' ? '#fff' : palette.bgPanel,
                                            color: palette.text,
                                            fontSize: '14px',
                                            boxSizing: 'border-box',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* Member Emails Section */}
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label style={{
                                            color: palette.text,
                                            fontWeight: '500',
                                            fontSize: '14px'
                                        }}>
                                            Invite Members (optional)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addEmailField}
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: palette.accent,
                                                color: theme === 'dark' ? '#000' : '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            + Add Email
                                        </button>
                                    </div>

                                    {createForm.emails.map((email, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginBottom: '8px',
                                            alignItems: 'center'
                                        }}>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => handleEmailChange(index, e.target.value)}
                                                placeholder={`Member email ${index + 1}`}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 12px',
                                                    border: `1px solid ${palette.border}`,
                                                    borderRadius: '6px',
                                                    backgroundColor: theme === 'light' ? '#fff' : palette.bgPanel,
                                                    color: palette.text,
                                                    fontSize: '14px',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            {createForm.emails.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeEmailField(index)}
                                                    style={{
                                                        padding: '8px',
                                                        backgroundColor: palette.danger,
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        minWidth: '28px'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <p style={{
                                        color: palette.textMuted,
                                        fontSize: '12px',
                                        margin: '8px 0 0 0'
                                    }}>
                                        Members will receive email invitations to join the group.
                                    </p>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'flex-end',
                                    paddingTop: '16px',
                                    borderTop: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: theme === 'light' ? '#fff' : 'transparent',
                                            color: palette.text,
                                            border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createLoading}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: palette.accent,
                                            color: theme === 'dark' ? '#000' : '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: createLoading ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            opacity: createLoading ? 0.6 : 1
                                        }}
                                    >
                                        {createLoading ? 'Creating...' : 'Create Group'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px 0',
                        color: palette.textMuted
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                        <p>Loading groups...</p>
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: isMobile ? '32px 16px' : '48px 32px',
                        backgroundColor: palette.bgSecondary,
                        borderRadius: '12px',
                        border: `1px solid ${palette.border}`
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: palette.text }}>
                            Group Management
                        </h3>
                        <p style={{ color: palette.textMuted, marginBottom: '24px' }}>
                            Create and manage your groups using the "+ Create Group" button above.
                        </p>
                    </div>
                )}

            </div>

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
                    padding: '16px'
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
    );
};

export default GroupManagement;