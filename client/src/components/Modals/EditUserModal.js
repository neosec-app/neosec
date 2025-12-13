import React from 'react';

function EditUserModal({ editingUser, setEditingUser, setShowEditModal, handleSaveUser, currentUser, theme, palette, closeEditModal }) {
    if (!editingUser) return null;

    const handleClose = () => {
        if (closeEditModal) {
            closeEditModal();
        } else {
            setShowEditModal(false);
            setEditingUser(null);
        }
    };

    return (
        <div
            onClick={handleClose}
            style={{
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
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: theme === 'light' ? '#ffffff' : palette.bgCard,
                    padding: '32px',
                    borderRadius: '16px',
                    border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`,
                    width: '90%',
                    maxWidth: '520px',
                    boxShadow: theme === 'light'
                        ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                    position: 'relative'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: palette.textMuted,
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.color = palette.text;
                        e.target.style.backgroundColor = theme === 'light' ? '#f3f4f6' : 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.color = palette.textMuted;
                        e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    ×
                </button>

                {/* Title and Subtitle */}
                <div style={{ marginBottom: '28px' }}>
                    <h2 style={{
                        color: palette.text,
                        marginTop: 0,
                        marginBottom: '6px',
                        fontSize: '24px',
                        fontWeight: 700
                    }}>
                        Edit User
                    </h2>
                    <p style={{
                        color: palette.textMuted,
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 400
                    }}>
                        Update user details and permissions
                    </p>
                </div>

                {/* Username / Email Field */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        color: palette.text,
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 500
                    }}>
                        Username / Email
                    </label>
                    <input
                        type="email"
                        value={editingUser.email}
                        readOnly
                        disabled
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            backgroundColor: theme === 'light' ? '#f9fafb' : '#1a1a1a',
                            border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`,
                            borderRadius: '8px',
                            color: palette.textMuted,
                            fontSize: '14px',
                            cursor: 'not-allowed',
                            boxSizing: 'border-box'
                        }}
                    />
                    <p style={{
                        color: palette.textMuted,
                        margin: '6px 0 0 0',
                        fontSize: '12px'
                    }}>
                        Email cannot be changed
                    </p>
                </div>

                {/* Role Dropdown */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        color: palette.text,
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: 500
                    }}>
                        Role
                    </label>
                    <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        disabled={editingUser.id === currentUser.id}
                        style={{
                            width: '100%',
                            padding: '12px 14px',
                            paddingRight: '40px',
                            backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
                            border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`,
                            borderRadius: '8px',
                            color: palette.text,
                            fontSize: '14px',
                            cursor: editingUser.id === currentUser.id ? 'not-allowed' : 'pointer',
                            outline: 'none',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${theme === 'light' ? '%231a1a1a' : '%23ffffff'}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 14px center',
                            backgroundSize: '12px',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                            if (editingUser.id !== currentUser.id) {
                                e.target.style.borderColor = palette.accent;
                                e.target.style.boxShadow = `0 0 0 3px ${theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)'}`;
                            }
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = theme === 'light' ? '#e5e7eb' : palette.border;
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {/* Status Toggle */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{
                            color: palette.text,
                            fontSize: '14px',
                            fontWeight: 400
                        }}>
                            User account is {editingUser.isApproved ? 'active' : 'inactive'}
                        </span>
                        <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '52px',
                            height: '28px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={editingUser.isApproved}
                                onChange={(e) => setEditingUser({ ...editingUser, isApproved: e.target.checked })}
                                style={{
                                    opacity: 0,
                                    width: 0,
                                    height: 0
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: editingUser.isApproved ? palette.accent : (theme === 'light' ? '#d1d5db' : '#4b5563'),
                                borderRadius: '28px',
                                transition: 'background-color 0.3s ease',
                                boxShadow: editingUser.isApproved
                                    ? (theme === 'light' ? '0 2px 4px rgba(34, 197, 94, 0.2)' : '0 2px 4px rgba(34, 197, 94, 0.3)')
                                    : 'none'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '""',
                                    height: '22px',
                                    width: '22px',
                                    left: editingUser.isApproved ? '26px' : '3px',
                                    bottom: '3px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '50%',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                }} />
                            </span>
                        </label>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    paddingTop: '8px',
                    borderTop: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: theme === 'light' ? '#ffffff' : 'transparent',
                            color: palette.text,
                            border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = theme === 'light' ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = theme === 'light' ? '#ffffff' : 'transparent';
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveUser}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: theme === 'light' ? '#1a1a1a' : palette.accent,
                            color: theme === 'light' ? '#ffffff' : '#121212',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = theme === 'light' ? '#2a2a2a' : '#2dd47e';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = theme === 'light' ? '#1a1a1a' : palette.accent;
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditUserModal;

