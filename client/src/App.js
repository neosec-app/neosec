import React, { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { authAPI } from './services/api';
import './index.css';
import ProfileManager from "./components/ProfileManager";

function App() {
    const [activeTab, setActiveTab] = useState('login');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, vpn, firewall, profiles, users

    useEffect(() => {
        const checkAuth = async () => {
            if (authAPI.isAuthenticated()) {
                try {
                    const currentUser = authAPI.getCurrentUser();
                    if (currentUser) setUser(currentUser);
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
                        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                            {user.email}
                        </p>

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
                            {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                    </div>

                    <nav>
                        <button
                            onClick={() => setCurrentView('dashboard')}
                            style={navButtonStyle(currentView === 'dashboard')}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setCurrentView('vpn')}
                            style={navButtonStyle(currentView === 'vpn')}
                        >
                            VPN Configurations
                        </button>
                        <button
                            onClick={() => setCurrentView('firewall')}
                            style={navButtonStyle(currentView === 'firewall')}
                        >
                            Firewall Rules
                        </button>
                        <button
                            onClick={() => setCurrentView('profiles')}
                            style={navButtonStyle(currentView === 'profiles')}
                        >
                            Security Profiles
                        </button>

                        {user.role === 'admin' && (
                            <button
                                onClick={() => setCurrentView('users')}
                                style={navButtonStyle(currentView === 'users')}
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
                            cursor: 'pointer'
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
                    {currentView === 'dashboard' && <DashboardView user={user} />}
                    {currentView === 'vpn' && <VPNView />}
                    {currentView === 'firewall' && <FirewallView />}
                    {currentView === 'profiles' && <ProfilesView />}
                    {currentView === 'users' && user.role === 'admin' && <UserManagementView />}
                </div>
            </div>
        );
    }

    // Login/register screen
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
                        <Register onSwitchToLogin={() => setActiveTab('login')} />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ------------------------ COMPONENTS BELOW ------------------------ */

function navButtonStyle(isActive) {
    return {
        width: '100%',
        padding: '12px 15px',
        marginBottom: '10px',
        backgroundColor: isActive ? '#1E402C' : 'transparent',
        color: isActive ? '#36E27B' : '#fff',
        border: isActive ? '1px solid #36E27B' : '1px solid transparent',
        borderRadius: '8px',
        textAlign: 'left',
        cursor: 'pointer'
    };
}

function DashboardView({ user }) {
    return (
        <div>
            <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Welcome to NeoSec</h1>
            <p style={{ color: '#888' }}>VPN & Firewall Manager Dashboard</p>

            {!user.isApproved && (
                <div style={{
                    padding: '20px',
                    backgroundColor: '#282828',
                    border: '1px solid #FF9800',
                    borderRadius: '8px',
                    marginBottom: '30px'
                }}>
                    <strong style={{ color: '#FF9800' }}>⚠️ Account Pending Approval</strong>
                    <p style={{ color: '#ccc' }}>
                        Your account is awaiting admin approval. Some features may be restricted.
                    </p>
                </div>
            )}
        </div>
    );
}

function VPNView() {
    return (
        <div>
            <h1>VPN Configurations</h1>
            <p>No VPN configurations yet.</p>
        </div>
    );
}

function FirewallView() {
    return (
        <div>
            <h1>Firewall Rules</h1>
            <p>No firewall rules yet.</p>
        </div>
    );
}

function ProfilesView() {
    return (
        <div>
            <h1>Security Profiles</h1>
            <ProfileManager />
        </div>
    );
}

function UserManagementView() {
    return (
        <div>
            <h1>User Management</h1>
            <p>Admin tools for managing users.</p>
        </div>
    );
}

export default App;
