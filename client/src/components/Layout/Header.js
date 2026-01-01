import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaChevronDown, FaEdit, FaSignOutAlt } from 'react-icons/fa';
import EditProfileModal from './EditProfileModal';

function Header({ user, theme, palette, isMobile, isTablet, onLogout, onUserUpdate }) {
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleProfileDropdown = () => {
        setProfileDropdownOpen(!profileDropdownOpen);
    };

    return (
        <header style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: isMobile ? 0 : '260px',
            height: '60px',
            backgroundColor: palette.bgCard,
            borderBottom: `1px solid ${palette.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 20px',
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'left 0.3s ease'
        }}>
            {/* Profile Section */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                    onClick={toggleProfileDropdown}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: palette.text,
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = palette.accentSoft;
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    <FaUserCircle size={24} />
                    {!isMobile && (
                        <>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                {user?.email?.split('@')[0] || 'User'}
                            </span>
                            <FaChevronDown size={12} style={{
                                transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease'
                            }} />
                        </>
                    )}
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        width: isMobile ? '280px' : '320px',
                        backgroundColor: palette.bgCard,
                        border: `1px solid ${palette.border}`,
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        zIndex: 1001,
                        marginTop: '8px',
                        overflow: 'hidden'
                    }}>
                        {/* Profile Header */}
                        <div style={{
                            padding: '20px',
                            backgroundColor: palette.accentSoft,
                            borderBottom: `1px solid ${palette.border}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FaUserCircle size={40} color={palette.accent} />
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: palette.text
                                    }}>
                                        {user?.email?.split('@')[0] || 'User'}
                                    </h3>
                                    <p style={{
                                        margin: '4px 0 0 0',
                                        fontSize: '14px',
                                        color: palette.textMuted
                                    }}>
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div style={{ padding: '16px 20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: palette.textMuted,
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Full Name
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: palette.text,
                                    fontWeight: '500'
                                }}>
                                    {user?.name || 'Not provided'}
                                </p>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: palette.textMuted,
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Email
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: palette.text,
                                    fontWeight: '500'
                                }}>
                                    {user?.email}
                                </p>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: palette.textMuted,
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Phone Number
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: palette.text,
                                    fontWeight: '500'
                                }}>
                                    {user?.phone || 'Not provided'}
                                </p>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: palette.textMuted,
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Account Type
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: palette.text,
                                    fontWeight: '500',
                                    textTransform: 'capitalize'
                                }}>
                                    {user?.accountType || 'Member'}
                                </p>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: palette.textMuted,
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Subscription Tier
                                </label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: palette.text,
                                    fontWeight: '500',
                                    textTransform: 'capitalize'
                                }}>
                                    {user?.subscriptionTier || 'Free'}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginTop: '20px',
                                paddingTop: '16px',
                                borderTop: `1px solid ${palette.border}`
                            }}>
                                <button
                                    onClick={() => {
                                        setProfileDropdownOpen(false);
                                        setEditProfileModalOpen(true);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        backgroundColor: palette.accent,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = palette.accentHover;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = palette.accent;
                                    }}
                                >
                                    <FaEdit size={14} />
                                    Edit Profile
                                </button>

                                <button
                                    onClick={onLogout}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        backgroundColor: palette.danger,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = palette.dangerHover;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = palette.danger;
                                    }}
                                >
                                    <FaSignOutAlt size={14} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                user={user}
                isOpen={editProfileModalOpen}
                onClose={() => setEditProfileModalOpen(false)}
                onUpdate={(updatedUser) => {
                    if (onUserUpdate) {
                        onUserUpdate(updatedUser);
                    }
                    setEditProfileModalOpen(false);
                }}
                theme={theme}
                palette={palette}
            />
        </header>
    );
}

export default Header;
