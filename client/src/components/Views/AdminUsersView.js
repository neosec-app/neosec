import React, { useState } from 'react';
import { MdModeEdit } from 'react-icons/md';
import { SlReload } from 'react-icons/sl';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { getCardBaseStyle } from '../../utils/styles';
import EditUserModal from '../Modals/EditUserModal';

function AdminUsersView({
    user,
    theme,
    palette,
    users,
    usersLoading,
    adminError,
    isMobile,
    isTablet,
    editingUser,
    setEditingUser,
    showEditModal,
    setShowEditModal,
    editModalAnimating,
    userSearchQuery,
    setUserSearchQuery,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    handleEditUser,
    handleDeleteUser,
    handleToggleUserStatus,
    handleSaveUser,
    closeEditModal
}) {
    const cardBase = getCardBaseStyle(palette, theme);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [actionButtonHover, setActionButtonHover] = useState(null);

    // Filter users
    const filteredUsers = users.filter(u => {
        if (userSearchQuery) {
            const searchLower = userSearchQuery.toLowerCase();
            const userIndex = users.indexOf(u) + 1;
            const userIDString = String(userIndex);
            const matchesEmail = u.email.toLowerCase().includes(searchLower);
            const matchesID = userIDString === userSearchQuery;
            if (!matchesEmail && !matchesID) return false;
        }

        const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
        const matchesStatus = userStatusFilter === 'all' ||
            (userStatusFilter === 'active' && u.isApproved) ||
            (userStatusFilter === 'inactive' && !u.isApproved);

        return matchesRole && matchesStatus;
    });

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <h1 style={{ fontSize: '24px', margin: 0, color: palette.text }}>User Management</h1>
            </div>

            {/* Users Table */}
            <div style={{ ...cardBase, padding: '18px' }}>
                <div style={{
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                    flexDirection: isMobile ? 'column' : 'row'
                }}>
                    <input
                        type="text"
                        placeholder="Search by username or ID..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        style={{
                            flex: '1 1 260px',
                            minWidth: '240px',
                            padding: '10px 12px',
                            backgroundColor: theme === 'light' ? '#fff' : '#121212',
                            border: `1px solid ${palette.border}`,
                            borderRadius: '10px',
                            color: palette.text,
                            fontSize: '14px'
                        }}
                    />

                    {/* Custom Role Dropdown */}
                    <div className="custom-dropdown" style={{ position: 'relative', flex: '0 0 160px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setRoleDropdownOpen(!roleDropdownOpen);
                                setStatusDropdownOpen(false);
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = palette.accent;
                                e.target.style.backgroundColor = theme === 'light'
                                    ? 'rgba(34, 197, 94, 0.05)'
                                    : 'rgba(34, 197, 94, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = palette.border;
                                e.target.style.backgroundColor = theme === 'light' ? '#fff' : '#121212';
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                paddingRight: '32px',
                                backgroundColor: theme === 'light' ? '#fff' : '#121212',
                                border: `1px solid ${roleDropdownOpen ? palette.accent : palette.border}`,
                                borderRadius: '10px',
                                color: palette.text,
                                fontSize: '14px',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: roleDropdownOpen ? `0 0 0 3px ${theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)'}` : 'none'
                            }}
                        >
                            <span>{userRoleFilter === 'all' ? 'All Roles' : userRoleFilter === 'admin' ? 'Admin' : 'User'}</span>
                            <span style={{
                                transform: roleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease',
                                display: 'inline-block'
                            }}>▼</span>
                        </button>
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: theme === 'light' ? '#fff' : '#121212',
                            border: `1px solid ${palette.border}`,
                            borderRadius: '10px',
                            overflow: 'hidden',
                            zIndex: 1000,
                            opacity: roleDropdownOpen ? 1 : 0,
                            transform: roleDropdownOpen ? 'translateY(0)' : 'translateY(-10px)',
                            pointerEvents: roleDropdownOpen ? 'auto' : 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: theme === 'light'
                                ? '0 4px 12px rgba(0,0,0,0.1)'
                                : '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                            {['all', 'admin', 'user'].map((option) => (
                                <div
                                    key={option}
                                    onClick={() => {
                                        setUserRoleFilter(option);
                                        setRoleDropdownOpen(false);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = theme === 'light'
                                            ? 'rgba(34, 197, 94, 0.1)'
                                            : 'rgba(34, 197, 94, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        color: palette.text,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s ease',
                                        backgroundColor: userRoleFilter === option
                                            ? (theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)')
                                            : 'transparent'
                                    }}
                                >
                                    {option === 'all' ? 'All Roles' : option === 'admin' ? 'Admin' : 'User'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Status Dropdown */}
                    <div className="custom-dropdown" style={{ position: 'relative', flex: '0 0 160px' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setStatusDropdownOpen(!statusDropdownOpen);
                                setRoleDropdownOpen(false);
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = palette.accent;
                                e.target.style.backgroundColor = theme === 'light'
                                    ? 'rgba(34, 197, 94, 0.05)'
                                    : 'rgba(34, 197, 94, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = palette.border;
                                e.target.style.backgroundColor = theme === 'light' ? '#fff' : '#121212';
                            }}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                paddingRight: '32px',
                                backgroundColor: theme === 'light' ? '#fff' : '#121212',
                                border: `1px solid ${statusDropdownOpen ? palette.accent : palette.border}`,
                                borderRadius: '10px',
                                color: palette.text,
                                fontSize: '14px',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: statusDropdownOpen ? `0 0 0 3px ${theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)'}` : 'none'
                            }}
                        >
                            <span>{userStatusFilter === 'all' ? 'All Status' : userStatusFilter === 'active' ? 'Active' : 'Inactive'}</span>
                            <span style={{
                                transform: statusDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease',
                                display: 'inline-block'
                            }}>▼</span>
                        </button>
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: theme === 'light' ? '#fff' : '#121212',
                            border: `1px solid ${palette.border}`,
                            borderRadius: '10px',
                            overflow: 'hidden',
                            zIndex: 1000,
                            opacity: statusDropdownOpen ? 1 : 0,
                            transform: statusDropdownOpen ? 'translateY(0)' : 'translateY(-10px)',
                            pointerEvents: statusDropdownOpen ? 'auto' : 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: theme === 'light'
                                ? '0 4px 12px rgba(0,0,0,0.1)'
                                : '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                            {['all', 'active', 'inactive'].map((option) => (
                                <div
                                    key={option}
                                    onClick={() => {
                                        setUserStatusFilter(option);
                                        setStatusDropdownOpen(false);
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = theme === 'light'
                                            ? 'rgba(34, 197, 94, 0.1)'
                                            : 'rgba(34, 197, 94, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        color: palette.text,
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s ease',
                                        backgroundColor: userStatusFilter === option
                                            ? (theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.15)')
                                            : 'transparent'
                                    }}
                                >
                                    {option === 'all' ? 'All Status' : option === 'active' ? 'Active' : 'Inactive'}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        style={{
                            padding: '10px 16px',
                            backgroundColor: palette.text,
                            color: theme === 'light' ? '#fff' : '#121212',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                        disabled
                    >
                        + Add New User
                    </button>
                </div>

                {usersLoading ? (
                    <div style={{ color: palette.textMuted, textAlign: 'center', padding: '40px' }}>Loading users...</div>
                ) : adminError ? (
                    <div style={{
                        padding: '20px',
                        backgroundColor: palette.danger + '20',
                        border: `1px solid ${palette.danger}`,
                        borderRadius: '10px',
                        color: palette.danger,
                        textAlign: 'center',
                        margin: '20px 0'
                    }}>
                        <strong>Error loading users:</strong> {adminError}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ color: palette.textMuted, textAlign: 'center', padding: '40px' }}>No users found matching your filters</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>User ID</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Username (Email)</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Role</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Status</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Last Login</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u, idx) => {
                                    const isCurrentUser = u.id === user.id;
                                    return (
                                        <tr key={u.id} style={{
                                            borderBottom: idx === filteredUsers.length - 1 ? 'none' : `1px solid ${palette.border}`,
                                            backgroundColor: isCurrentUser
                                                ? (theme === 'light' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.12)')
                                                : 'transparent',
                                            borderLeft: isCurrentUser ? `3px solid ${palette.accent}` : 'none',
                                            transition: 'all 0.2s ease',
                                            position: 'relative'
                                        }}>
                                            <td style={{ padding: '12px', color: palette.text, fontSize: '14px' }}>
                                                {String(users.indexOf(u) + 1).padStart(3, '0')}
                                                {isCurrentUser && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        padding: '2px 6px',
                                                        backgroundColor: palette.accent,
                                                        color: theme === 'light' ? '#fff' : '#121212',
                                                        borderRadius: '4px',
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>YOU</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', color: palette.text, fontSize: '14px', fontWeight: isCurrentUser ? 600 : 400 }}>
                                                {u.email}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    backgroundColor: u.role === 'admin' ? '#0b0b14' : palette.accentSoft,
                                                    color: u.role === 'admin' ? '#fff' : palette.accent,
                                                    border: u.role === 'admin' ? '1px solid #0b0b14' : `1px solid ${palette.border}`,
                                                    fontWeight: 600
                                                }}>
                                                    {u.role === 'admin' ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    minWidth: '78px',
                                                    textAlign: 'center',
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    backgroundColor: u.isApproved
                                                        ? (theme === 'dark' ? palette.accentSoft : '#e6f6ed')
                                                        : (theme === 'dark' ? '#2b1b12' : '#fff5e6'),
                                                    color: u.isApproved
                                                        ? (theme === 'dark' ? palette.accent : '#1fa45a')
                                                        : (theme === 'dark' ? '#f6ae4c' : '#d97706'),
                                                    border: u.isApproved
                                                        ? (theme === 'dark' ? `1px solid ${palette.accent}` : '1px solid #c9ecd8')
                                                        : (theme === 'dark' ? '1px solid #3a2a1f' : '1px solid #f3d9a4'),
                                                    fontWeight: 600
                                                }}>
                                                    {u.isApproved ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', color: palette.textMuted, fontSize: '13px' }}>
                                                —
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => handleEditUser(u)}
                                                        onMouseEnter={() => setActionButtonHover(`edit-user-${u.id}`)}
                                                        onMouseLeave={() => setActionButtonHover(null)}
                                                        title="Edit user"
                                                        style={{
                                                            background: actionButtonHover === `edit-user-${u.id}`
                                                                ? (theme === 'dark' ? 'rgba(54,226,123,0.15)' : 'rgba(31,164,90,0.1)')
                                                                : 'none',
                                                            border: 'none',
                                                            color: actionButtonHover === `edit-user-${u.id}`
                                                                ? palette.accent
                                                                : palette.textMuted,
                                                            cursor: 'pointer',
                                                            fontSize: '16px',
                                                            padding: '4px 6px',
                                                            borderRadius: '6px',
                                                            transition: 'all 0.15s ease',
                                                            transform: actionButtonHover === `edit-user-${u.id}` ? 'scale(1.1)' : 'scale(1)'
                                                        }}
                                                    >
                                                        <MdModeEdit />
                                                    </button>
                                                    {u.id !== user.id && (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleUserStatus(u)}
                                                                onMouseEnter={() => setActionButtonHover(`toggle-user-${u.id}`)}
                                                                onMouseLeave={() => setActionButtonHover(null)}
                                                                title={u.isApproved ? 'Mark inactive' : 'Mark active'}
                                                                style={{
                                                                    background: actionButtonHover === `toggle-user-${u.id}`
                                                                        ? (theme === 'dark' ? 'rgba(54,226,123,0.20)' : 'rgba(31,164,90,0.15)')
                                                                        : (u.isApproved
                                                                            ? (theme === 'dark' ? 'rgba(54,226,123,0.08)' : '#e6f6ed')
                                                                            : (theme === 'dark' ? 'rgba(246,174,76,0.10)' : '#fff7e6')),
                                                                    border: u.isApproved
                                                                        ? (theme === 'dark' ? `1px solid ${palette.accent}` : '1px solid #c9ecd8')
                                                                        : (theme === 'dark' ? '1px solid #3a2a1f' : '1px solid #f3d9a4'),
                                                                    color: actionButtonHover === `toggle-user-${u.id}`
                                                                        ? palette.accent
                                                                        : (u.isApproved
                                                                            ? (theme === 'dark' ? palette.accent : '#1fa45a')
                                                                            : (theme === 'dark' ? '#f6ae4c' : '#d97706')),
                                                                    cursor: 'pointer',
                                                                    fontSize: '16px',
                                                                    padding: '6px 10px',
                                                                    borderRadius: '12px',
                                                                    transition: 'all 0.2s ease',
                                                                    transform: actionButtonHover === `toggle-user-${u.id}` ? 'scale(1.08)' : 'scale(1)',
                                                                    boxShadow: actionButtonHover === `toggle-user-${u.id}` ? '0 6px 14px rgba(0,0,0,0.12)' : 'none'
                                                                }}
                                                            >
                                                                <SlReload />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                onMouseEnter={() => setActionButtonHover(`delete-user-${u.id}`)}
                                                                onMouseLeave={() => setActionButtonHover(null)}
                                                                title="Delete user"
                                                                style={{
                                                                    background: actionButtonHover === `delete-user-${u.id}`
                                                                        ? (theme === 'dark' ? 'rgba(224,72,72,0.15)' : 'rgba(212,24,61,0.1)')
                                                                        : 'none',
                                                                    border: 'none',
                                                                    color: palette.danger,
                                                                    cursor: 'pointer',
                                                                    fontSize: '16px',
                                                                    padding: '4px 6px',
                                                                    borderRadius: '6px',
                                                                    transition: 'all 0.15s ease',
                                                                    transform: actionButtonHover === `delete-user-${u.id}` ? 'scale(1.1)' : 'scale(1)',
                                                                    opacity: actionButtonHover === `delete-user-${u.id}` ? 1 : 0.8
                                                                }}
                                                            >
                                                                <RiDeleteBin6Line />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {(showEditModal || editModalAnimating) && editingUser && (
                <EditUserModal
                    editingUser={editingUser}
                    setEditingUser={setEditingUser}
                    setShowEditModal={setShowEditModal}
                    handleSaveUser={handleSaveUser}
                    currentUser={user}
                    theme={theme}
                    palette={palette}
                    closeEditModal={closeEditModal}
                />
            )}
        </div>
    );
}

export default AdminUsersView;

