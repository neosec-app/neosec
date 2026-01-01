import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaPhone, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { authAPI } from '../../services/api';

function EditProfileModal({ user, isOpen, onClose, onUpdate, theme, palette }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setErrors({});
        }
    }, [isOpen, user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation (optional but if provided, not empty)
        if (formData.name.trim() && formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        // Phone validation (optional but if provided, valid format)
        if (formData.phone.trim()) {
            const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(formData.phone.replace(/[\s\-()]/g, ''))) {
                newErrors.phone = 'Please enter a valid phone number';
            }
        }

        // Password validation (only if user wants to change password)
        if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
            if (!formData.currentPassword) {
                newErrors.currentPassword = 'Current password is required to change password';
            }
            if (!formData.newPassword) {
                newErrors.newPassword = 'New password is required';
            } else if (formData.newPassword.length < 6) {
                newErrors.newPassword = 'Password must be at least 6 characters';
            }
            if (formData.newPassword !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Prepare data to send (only include fields that are being updated)
            const updateData = {};

            if (formData.name !== (user.name || '')) {
                updateData.name = formData.name.trim() || null;
            }

            if (formData.phone !== (user.phone || '')) {
                updateData.phone = formData.phone.trim() || null;
            }

            // Only include password fields if user is changing password
            if (formData.newPassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            // Only make API call if there's something to update
            if (Object.keys(updateData).length > 0) {
                const response = await authAPI.updateProfile(updateData);
                onUpdate(response.user);
                onClose();
            } else {
                onClose(); // No changes made
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            if (error.response?.data?.message) {
                // Handle specific API errors
                if (error.response.data.message.includes('Current password')) {
                    setErrors({ currentPassword: error.response.data.message });
                } else if (error.response.data.message.includes('password')) {
                    setErrors({ newPassword: error.response.data.message });
                } else {
                    setErrors({ general: error.response.data.message });
                }
            } else {
                setErrors({ general: 'Failed to update profile. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div
                style={{
                    backgroundColor: palette.bgCard,
                    borderRadius: '16px',
                    border: `1px solid ${palette.border}`,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    animation: 'modalSlideIn 0.3s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 24px 0 24px',
                    borderBottom: `1px solid ${palette.border}`,
                    marginBottom: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '20px',
                            fontWeight: '600',
                            color: palette.text
                        }}>
                            Edit Profile
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '8px',
                                color: palette.textMuted,
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = palette.accentSoft;
                                e.target.style.color = palette.text;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = palette.textMuted;
                            }}
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px 24px' }}>
                    {/* General Error */}
                    {errors.general && (
                        <div style={{
                            padding: '12px 16px',
                            backgroundColor: palette.dangerSoft,
                            border: `1px solid ${palette.danger}`,
                            borderRadius: '8px',
                            marginBottom: '20px',
                            color: palette.danger,
                            fontSize: '14px'
                        }}>
                            {errors.general}
                        </div>
                    )}

                    {/* Name Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: palette.text,
                            marginBottom: '8px'
                        }}>
                            <FaUser style={{ marginRight: '8px' }} />
                            Full Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter your full name"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${errors.name ? palette.danger : palette.border}`,
                                borderRadius: '8px',
                                backgroundColor: palette.bgMain,
                                color: palette.text,
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s ease'
                            }}
                        />
                        {errors.name && (
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: palette.danger
                            }}>
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Phone Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: palette.text,
                            marginBottom: '8px'
                        }}>
                            <FaPhone style={{ marginRight: '8px' }} />
                            Phone Number (Optional)
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Enter your phone number"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${errors.phone ? palette.danger : palette.border}`,
                                borderRadius: '8px',
                                backgroundColor: palette.bgMain,
                                color: palette.text,
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s ease'
                            }}
                        />
                        {errors.phone && (
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '12px',
                                color: palette.danger
                            }}>
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    {/* Password Section */}
                    <div style={{
                        borderTop: `1px solid ${palette.border}`,
                        paddingTop: '20px',
                        marginTop: '20px'
                    }}>
                        <h3 style={{
                            margin: '0 0 16px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: palette.text
                        }}>
                            <FaLock style={{ marginRight: '8px' }} />
                            Change Password (Optional)
                        </h3>

                        {/* Current Password */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: palette.text,
                                marginBottom: '8px'
                            }}>
                                Current Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={formData.currentPassword}
                                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                    placeholder="Enter current password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 16px',
                                        border: `1px solid ${errors.currentPassword ? palette.danger : palette.border}`,
                                        borderRadius: '8px',
                                        backgroundColor: palette.bgMain,
                                        color: palette.text,
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: palette.textMuted
                                    }}
                                >
                                    {showPasswords.current ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                            {errors.currentPassword && (
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '12px',
                                    color: palette.danger
                                }}>
                                    {errors.currentPassword}
                                </p>
                            )}
                        </div>

                        {/* New Password */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: palette.text,
                                marginBottom: '8px'
                            }}>
                                New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={formData.newPassword}
                                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                    placeholder="Enter new password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 16px',
                                        border: `1px solid ${errors.newPassword ? palette.danger : palette.border}`,
                                        borderRadius: '8px',
                                        backgroundColor: palette.bgMain,
                                        color: palette.text,
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: palette.textMuted
                                    }}
                                >
                                    {showPasswords.new ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '12px',
                                    color: palette.danger
                                }}>
                                    {errors.newPassword}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: palette.text,
                                marginBottom: '8px'
                            }}>
                                Confirm New Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    placeholder="Confirm new password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 16px',
                                        border: `1px solid ${errors.confirmPassword ? palette.danger : palette.border}`,
                                        borderRadius: '8px',
                                        backgroundColor: palette.bgMain,
                                        color: palette.text,
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: palette.textMuted
                                    }}
                                >
                                    {showPasswords.confirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p style={{
                                    margin: '4px 0 0 0',
                                    fontSize: '12px',
                                    color: palette.danger
                                }}>
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'transparent',
                                color: palette.textMuted,
                                border: `1px solid ${palette.border}`,
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: loading ? palette.textMuted : palette.accent,
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

export default EditProfileModal;

