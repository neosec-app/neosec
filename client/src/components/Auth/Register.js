import React, { useState } from 'react';
import { authAPI } from '../../services/api';

const Register = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        // Check for at least one letter
        if (!/[A-Za-z]/.test(formData.password)) {
            setError('Password must contain at least one letter');
            setLoading(false);
            return;
        }

        // Check for at least one number
        if (!/[0-9]/.test(formData.password)) {
            setError('Password must contain at least one number');
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.register(formData.email, formData.password);

            if (response.success) {
                setSuccess(response.message || 'Registration successful! Please wait for admin approval.');
                setFormData({
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
            } else {
                setError(response.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            // Extract error message from backend validation
            let errorMessage = 'Registration failed. Please try again.';
            
            if (err.response?.data) {
                // Check for validation errors array
                if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                    errorMessage = err.response.data.errors.map(e => e.msg || e.message).join(', ');
                } 
                // Check for single error message
                else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '380px',
                backgroundColor: '#1c1c1c',
                borderRadius: '8px',
                padding: '40px 35px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Shield Icon */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto',
                        backgroundColor: '#36E27B',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 style={{
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    letterSpacing: '1px'
                }}>REGISTER</h2>

                <p style={{
                    color: '#888',
                    textAlign: 'center',
                    fontSize: '14px',
                    margin: '0 0 32px 0'
                }}>Join NeoShield today</p>

                {error && (
                    <div style={{
                        padding: '12px 15px',
                        backgroundColor: '#2a1515',
                        border: '1px solid #ff4444',
                        borderRadius: '6px',
                        color: '#ff6666',
                        marginBottom: '20px',
                        fontSize: '13px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '12px 15px',
                        backgroundColor: '#1a2a1f',
                        border: '1px solid #36E27B',
                        borderRadius: '6px',
                        color: '#36E27B',
                        marginBottom: '20px',
                        fontSize: '13px',
                        textAlign: 'center'
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            color: '#bbb',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '400'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #3a3a3a',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#36E27B'}
                            onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                        />
                    </div>

                    {/* Password Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            color: '#bbb',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '400'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password (min 6 chars, letter + number)"
                            minLength={6}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #3a3a3a',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#36E27B'}
                            onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                        />
                    </div>

                    {/* Confirm Password Field */}
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block',
                            color: '#bbb',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '400'
                        }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your password"
                            minLength={6}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #3a3a3a',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#36E27B'}
                            onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                        />
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: loading ? '#2a5f3d' : '#36E27B',
                            color: '#000',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '15px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.7 : 1,
                            letterSpacing: '0.5px'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#2ec96d';
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) e.target.style.backgroundColor = '#36E27B';
                        }}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                {/* Login Link */}
                <p style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    color: '#777',
                    fontSize: '13px'
                }}>
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#36E27B',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            padding: 0,
                            textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                        Login here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;