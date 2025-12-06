import React, { useState } from 'react';
import { authAPI } from '../../services/api';

const Login = ({ onSwitchToRegister, onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(formData.email, formData.password);

            if (response.success) {
                if (onLoginSuccess) {
                    onLoginSuccess(response.user);
                }
            } else {
                setError(response.message || 'Login failed. Please try again.');
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Login failed. Please check your credentials and try again.'
            );
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
                }}>LOGIN</h2>

                <p style={{
                    color: '#888',
                    textAlign: 'center',
                    fontSize: '14px',
                    margin: '0 0 32px 0'
                }}>Welcome back to NeoShield</p>

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

                <form onSubmit={handleSubmit}>
                    {/* Username/Email Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            color: '#bbb',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '400'
                        }}>
                            Username
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your username"
                            autoComplete="email"
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
                    <div style={{ marginBottom: '24px' }}>
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
                            placeholder="Enter your password"
                            autoComplete="current-password"
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

                    {/* Checkboxes */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: '#aaa',
                            fontSize: '13px',
                            cursor: 'pointer',
                            marginBottom: '10px'
                        }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    marginRight: '10px',
                                    cursor: 'pointer',
                                    accentColor: '#36E27B'
                                }}
                            />
                            Automatically fetch and apply new rules
                        </label>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: '#aaa',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    marginRight: '10px',
                                    cursor: 'pointer',
                                    accentColor: '#36E27B'
                                }}
                            />
                            Start application on system boot
                        </label>
                    </div>

                    {/* Login Button */}
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
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Register Link */}
                <p style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    color: '#777',
                    fontSize: '13px'
                }}>
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
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
                        Register here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;