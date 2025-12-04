import React, { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { authAPI } from './services/api';
import './index.css';

function App() {
    const [activeTab, setActiveTab] = useState('login');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, vpn, firewall, profiles

    useEffect(() => {
        const checkAuth = async () => {
            if (authAPI.isAuthenticated()) {
                try {
                    const currentUser = authAPI.getCurrentUser();
                    if (currentUser) {
                        setUser(currentUser);
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                    authAPI.logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        authAPI.logout();
        setUser(null);
        setActiveTab('login');
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#121212',
                color: '#36E27B',
                fontSize: '18px'
            }}>
                Loading...
            </div>
        );
    }

    // If user is logged in, show dashboard
    if (user) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#121212',
                color: '#fff',
                display: 'flex'
            }}>
                {/* Sidebar */}
                <div style={{
                    width: '250px',
                    backgroundColor: '#181818',
                    padding: '20px',
                    borderRight: '1px solid #282828'
                }}>
                    <div style={{
                        marginBottom: '40px',
                        paddingBottom: '20px',
                        borderBottom: '1px solid #282828'
                    }}>
                        <h2 style={{
                            color: '#36E27B',
                            margin: '0 0 10px 0',
                            fontSize: '24px'
                        }}>NeoSec</h2>
                        <p style={{
                            margin: 0,
                            fontSize: '12px',
                            color: '#888'
                        }}>{user.email}</p>
                        <span style={{
                            display: 'inline-block',
                            marginTop: '10px',
                            padding: '5px 12px',
                            borderRadius: '15px',
                            fontSize: '12px',
                            backgroundColor: user.role === 'admin' ? '#1E402C' : '#282828',
                            color: user.role === 'admin' ? '#36E27B' : '#fff',
                            border: user.role === 'admin' ? '1px solid #36E27B' : '1px solid #444'
                        }}>
              {user.role === 'admin' ? ' Admin' : ' User'}
            </span>
                    </div>

                    <nav>
                        <button
                            onClick={() => setCurrentView('dashboard')}
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                marginBottom: '10px',
                                backgroundColor: currentView === 'dashboard' ? '#1E402C' : 'transparent',
                                color: currentView === 'dashboard' ? '#36E27B' : '#fff',
                                border: currentView === 'dashboard' ? '1px solid #36E27B' : '1px solid transparent',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                             Dashboard
                        </button>

                        <button
                            onClick={() => setCurrentView('vpn')}
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                marginBottom: '10px',
                                backgroundColor: currentView === 'vpn' ? '#1E402C' : 'transparent',
                                color: currentView === 'vpn' ? '#36E27B' : '#fff',
                                border: currentView === 'vpn' ? '1px solid #36E27B' : '1px solid transparent',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                             VPN Configurations
                        </button>

                        <button
                            onClick={() => setCurrentView('firewall')}
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                marginBottom: '10px',
                                backgroundColor: currentView === 'firewall' ? '#1E402C' : 'transparent',
                                color: currentView === 'firewall' ? '#36E27B' : '#fff',
                                border: currentView === 'firewall' ? '1px solid #36E27B' : '1px solid transparent',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                             Firewall Rules
                        </button>

                        <button
                            onClick={() => setCurrentView('profiles')}
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                marginBottom: '10px',
                                backgroundColor: currentView === 'profiles' ? '#1E402C' : 'transparent',
                                color: currentView === 'profiles' ? '#36E27B' : '#fff',
                                border: currentView === 'profiles' ? '1px solid #36E27B' : '1px solid transparent',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                             Security Profiles
                        </button>

                        {user.role === 'admin' && (
                            <button
                                onClick={() => setCurrentView('users')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'users' ? '#1E402C' : 'transparent',
                                    color: currentView === 'users' ? '#36E27B' : '#fff',
                                    border: currentView === 'users' ? '1px solid #36E27B' : '1px solid transparent',
                                    borderRadius: '8px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                 User Management
                            </button>
                        )}
                    </nav>

                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            marginTop: '30px',
                            backgroundColor: '#282828',
                            color: '#fff',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                         Logout
                    </button>
                </div>

                {/* Main Content */}
                <div style={{
                    flex: 1,
                    padding: '40px',
                    overflowY: 'auto'
                }}>
                    {/* Dashboard View */}
                    {currentView === 'dashboard' && (
                        <div>
                            <h1 style={{
                                fontSize: '32px',
                                marginBottom: '10px',
                                color: '#fff'
                            }}>Welcome to NeoSec</h1>
                            <p style={{
                                color: '#888',
                                marginBottom: '30px'
                            }}>VPN & Firewall Manager Dashboard</p>

                            {!user.isApproved && (
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: '#282828',
                                    border: '1px solid #FF9800',
                                    borderRadius: '8px',
                                    marginBottom: '30px'
                                }}>
                                    <strong style={{ color: '#FF9800' }}>⚠️ Account Pending Approval</strong>
                                    <p style={{ margin: '10px 0 0 0', color: '#ccc' }}>
                                        Your account is awaiting admin approval. Some features may be restricted.
                                    </p>
                                </div>
                            )}

                            {/* Stats Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '20px',
                                marginBottom: '30px'
                            }}>
                                <div style={{
                                    padding: '25px',
                                    backgroundColor: '#181818',
                                    border: '1px solid #282828',
                                    borderRadius: '10px'
                                }}>
                                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                                        VPN Status
                                    </div>
                                    <div style={{ fontSize: '24px', color: '#36E27B', fontWeight: 'bold' }}>
                                        Connected
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                                        Server: Singapore
                                    </div>
                                </div>

                                <div style={{
                                    padding: '25px',
                                    backgroundColor: '#181818',
                                    border: '1px solid #282828',
                                    borderRadius: '10px'
                                }}>
                                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                                        Threats Blocked
                                    </div>
                                    <div style={{ fontSize: '24px', color: '#36E27B', fontWeight: 'bold' }}>
                                        247
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                                        Last 24 hours
                                    </div>
                                </div>

                                <div style={{
                                    padding: '25px',
                                    backgroundColor: '#181818',
                                    border: '1px solid #282828',
                                    borderRadius: '10px'
                                }}>
                                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>
                                        Active Rules
                                    </div>
                                    <div style={{ fontSize: '24px', color: '#36E27B', fontWeight: 'bold' }}>
                                        12
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                                        Firewall rules active
                                    </div>
                                </div>
                            </div>

                            {/* User Info Card */}
                            <div style={{
                                padding: '25px',
                                backgroundColor: '#181818',
                                border: '1px solid #282828',
                                borderRadius: '10px'
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    marginBottom: '20px',
                                    color: '#fff'
                                }}>Account Information</h2>
                                <div style={{ display: 'grid', gap: '15px' }}>
                                    <div>
                                        <span style={{ color: '#888' }}>Email: </span>
                                        <span style={{ color: '#fff' }}>{user.email}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: '#888' }}>Role: </span>
                                        <span style={{
                                            color: user.role === 'admin' ? '#36E27B' : '#fff',
                                            fontWeight: user.role === 'admin' ? 'bold' : 'normal'
                                        }}>{user.role}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: '#888' }}>Status: </span>
                                        <span style={{ color: user.isApproved ? '#36E27B' : '#FF9800' }}>
                      {user.isApproved ? '✅ Approved' : '⏳ Pending'}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VPN View */}
                    {currentView === 'vpn' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '30px'
                            }}>
                                <h1 style={{ fontSize: '32px', margin: 0 }}>VPN Configurations</h1>
                                <button style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#36E27B',
                                    color: '#121212',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}>
                                    + Add VPN Config
                                </button>
                            </div>

                            <div style={{
                                padding: '25px',
                                backgroundColor: '#181818',
                                border: '1px solid #282828',
                                borderRadius: '10px',
                                textAlign: 'center',
                                color: '#888'
                            }}>
                                <p>No VPN configurations yet. Click "Add VPN Config" to create your first configuration.</p>
                            </div>
                        </div>
                    )}

                    {/* Firewall View */}
                    {currentView === 'firewall' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '30px'
                            }}>
                                <h1 style={{ fontSize: '32px', margin: 0 }}>Firewall Rules</h1>
                                <button style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#36E27B',
                                    color: '#121212',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}>
                                    + Add Rule
                                </button>
                            </div>

                            <div style={{
                                padding: '25px',
                                backgroundColor: '#181818',
                                border: '1px solid #282828',
                                borderRadius: '10px',
                                textAlign: 'center',
                                color: '#888'
                            }}>
                                <p>No firewall rules configured. Click "Add Rule" to create your first rule.</p>
                            </div>
                        </div>
                    )}

                    {/* Profiles View */}
                    {currentView === 'profiles' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '30px'
                            }}>
                                <h1 style={{ fontSize: '32px', margin: 0 }}>Security Profiles</h1>
                                <button style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#36E27B',
                                    color: '#121212',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}>
                                    + Create Profile
                                </button>
                            </div>

                            <div style={{
                                padding: '25px',
                                backgroundColor: '#181818',
                                border: '1px solid #282828',
                                borderRadius: '10px',
                                textAlign: 'center',
                                color: '#888'
                            }}>
                                <p>No security profiles yet. Click "Create Profile" to set up your first profile.</p>
                            </div>
                        </div>
                    )}

                    {/* User Management View (Admin Only) */}
                    {currentView === 'users' && user.role === 'admin' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '30px'
                            }}>
                                <h1 style={{ fontSize: '32px', margin: 0 }}>User Management</h1>
                            </div>

                            <div style={{
                                padding: '25px',
                                backgroundColor: '#181818',
                                border: '1px solid #36E27B',
                                borderRadius: '10px'
                            }}>
                                <h3 style={{ color: '#36E27B', marginTop: 0 }}>👑 Admin Panel</h3>
                                <p style={{ color: '#ccc' }}>
                                    As an admin, you can manage all users, approve registrations, and configure system-wide settings.
                                </p>
                                <ul style={{ color: '#888', lineHeight: '1.8' }}>
                                    <li>View and edit all user accounts</li>
                                    <li>Approve or reject pending registrations</li>
                                    <li>Assign roles and permissions</li>
                                    <li>Monitor system activity and logs</li>
                                    <li>Configure global security policies</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show login/register forms
    return (
        <div className="app-container">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>NeoSec</h1>
                    <p>Welcome! Please login or register to continue.</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => setActiveTab('register')}
                    >
                        Register
                    </button>
                </div>

                <div className="auth-content">
                    {activeTab === 'login' ? (
                        <Login
                            onSwitchToRegister={() => setActiveTab('register')}
                            onLoginSuccess={handleLoginSuccess}
                        />
                    ) : (
                        <Register
                            onSwitchToLogin={() => setActiveTab('login')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;