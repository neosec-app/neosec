import React, { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { authAPI, dashboardAPI, adminAPI, firewallAPI } from './services/api';
import './index.css';
import ProfileManager from './components/ProfileManager';

function App() {
    const [activeTab, setActiveTab] = useState('login');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, vpn, firewall, profiles
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [firewallRules, setFirewallRules] = useState([]);
    const [firewallLoading, setFirewallLoading] = useState(false);
    const [firewallError, setFirewallError] = useState('');
    const [editingRuleId, setEditingRuleId] = useState(null);
    const [firewallForm, setFirewallForm] = useState({
        action: 'allow',
        direction: 'inbound',
        ipAddress: '',
        port: '',
        description: ''
    });

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

    // Fetch dashboard data when user is logged in
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (user && currentView === 'dashboard') {
                try {
                    setDashboardLoading(true);
                    const response = await dashboardAPI.getDashboard();
                    if (response.success) {
                        setDashboardData(response.data);
                    }
                } catch (error) {
                    console.error('Dashboard fetch error:', error);
                } finally {
                    setDashboardLoading(false);
                }
            }
        };

        fetchDashboardData();
    }, [user, currentView]);

    // Fetch users and stats when admin views user management
    useEffect(() => {
        const fetchAdminData = async () => {
            if (user && user.role === 'admin' && currentView === 'users') {
                try {
                    setUsersLoading(true);
                    const [usersResponse, statsResponse] = await Promise.all([
                        adminAPI.getAllUsers(),
                        adminAPI.getStatistics()
                    ]);
                    if (usersResponse.success) {
                        setUsers(usersResponse.data || []);
                    }
                    if (statsResponse.success) {
                        setAdminStats(statsResponse.data);
                    }
                } catch (error) {
                    console.error('Admin data fetch error:', error);
                } finally {
                    setUsersLoading(false);
                }
            }
        };

        fetchAdminData();
    }, [user, currentView]);

    // Fetch firewall rules when viewing firewall
    useEffect(() => {
        const fetchFirewallRules = async () => {
            if (user && currentView === 'firewall') {
                try {
                    setFirewallLoading(true);
                    setFirewallError('');
                    const response = await firewallAPI.getRules();
                    if (response.success) {
                        setFirewallRules(response.data || []);
                    } else {
                        setFirewallError(response.message || 'Failed to load firewall rules');
                    }
                } catch (error) {
                    console.error('Firewall fetch error:', error);
                    setFirewallError(error.response?.data?.message || 'Failed to load firewall rules');
                } finally {
                    setFirewallLoading(false);
                }
            }
        };

        fetchFirewallRules();
    }, [user, currentView]);

    const handleEditUser = (userToEdit) => {
        setEditingUser({ ...userToEdit });
        setShowEditModal(true);
    };

    const handleSaveUser = async () => {
        try {
            const response = await adminAPI.updateUser(editingUser.id, {
                email: editingUser.email,
                role: editingUser.role,
                isApproved: editingUser.isApproved
            });
            if (response.success) {
                setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
                setShowEditModal(false);
                setEditingUser(null);
            }
        } catch (error) {
            console.error('Update user error:', error);
            alert('Failed to update user: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }
        try {
            const response = await adminAPI.deleteUser(userId);
            if (response.success) {
                setUsers(users.filter(u => u.id !== userId));
            }
        } catch (error) {
            console.error('Delete user error:', error);
            alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
        }
    };

    // Firewall handlers
    const resetFirewallForm = () => {
        setFirewallForm({
            action: 'allow',
            direction: 'inbound',
            ipAddress: '',
            port: '',
            description: ''
        });
        setEditingRuleId(null);
    };

    const handleFirewallChange = (e) => {
        const { name, value } = e.target;
        setFirewallForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveRule = async (e) => {
        e.preventDefault();
        setFirewallError('');
        try {
            const payload = {
                ...firewallForm,
                port: firewallForm.port ? Number(firewallForm.port) : null,
                ipAddress: firewallForm.ipAddress || null,
                description: firewallForm.description || null
            };

            let response;
            if (editingRuleId) {
                response = await firewallAPI.updateRule(editingRuleId, payload);
                if (response.success) {
                    setFirewallRules((prev) =>
                        prev.map((rule) => (rule.id === editingRuleId ? response.data : rule))
                    );
                }
            } else {
                response = await firewallAPI.createRule(payload);
                if (response.success) {
                    setFirewallRules((prev) => [response.data, ...prev]);
                }
            }

            if (!response?.success) {
                setFirewallError(response?.message || 'Failed to save firewall rule');
                return;
            }

            resetFirewallForm();
        } catch (error) {
            console.error('Save firewall rule error:', error);
            setFirewallError(error.response?.data?.message || 'Failed to save firewall rule');
        }
    };

    const handleEditRule = (rule) => {
        setEditingRuleId(rule.id);
        setFirewallForm({
            action: rule.action,
            direction: rule.direction,
            ipAddress: rule.ipAddress || '',
            port: rule.port || '',
            description: rule.description || ''
        });
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm('Delete this firewall rule?')) return;
        setFirewallError('');
        try {
            const response = await firewallAPI.deleteRule(id);
            if (response.success) {
                setFirewallRules((prev) => prev.filter((rule) => rule.id !== id));
            } else {
                setFirewallError(response.message || 'Failed to delete firewall rule');
            }
        } catch (error) {
            console.error('Delete firewall rule error:', error);
            setFirewallError(error.response?.data?.message || 'Failed to delete firewall rule');
        }
    };

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
                                    {dashboardLoading ? (
                                        <div style={{ fontSize: '14px', color: '#888' }}>Loading...</div>
                                    ) : (
                                        <>
                                            <div style={{ 
                                                fontSize: '24px', 
                                                color: dashboardData?.vpnStatus?.connected ? '#36E27B' : '#FF9800', 
                                                fontWeight: 'bold' 
                                            }}>
                                                {dashboardData?.vpnStatus?.connected ? 'Connected' : 'Disconnected'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                                                {dashboardData?.vpnStatus?.server 
                                                    ? `Server: ${dashboardData.vpnStatus.server}` 
                                                    : 'No active connection'}
                                            </div>
                                        </>
                                    )}
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
                                    {dashboardLoading ? (
                                        <div style={{ fontSize: '14px', color: '#888' }}>Loading...</div>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '24px', color: '#36E27B', fontWeight: 'bold' }}>
                                                {dashboardData?.threatsBlocked?.last24Hours || 0}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                                                Last 24 hours (Total: {dashboardData?.threatsBlocked?.total || 0})
                                            </div>
                                        </>
                                    )}
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
                                <button
                                    onClick={resetFirewallForm}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#36E27B',
                                        color: '#121212',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}>
                                    {editingRuleId ? 'Cancel Edit' : 'Reset Form'}
                                </button>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                marginBottom: '30px'
                            }}>
                                {/* Add / Edit Rule Form */}
                                <div style={{
                                    padding: '25px',
                                    backgroundColor: '#181818',
                                    border: '1px solid #282828',
                                    borderRadius: '10px'
                                }}>
                                    <h2 style={{ color: '#fff', marginTop: 0, marginBottom: '16px' }}>
                                        {editingRuleId ? 'Edit Firewall Rule' : 'Add Firewall Rule'}
                                    </h2>
                                    {firewallError && (
                                        <div style={{
                                            padding: '12px',
                                            marginBottom: '12px',
                                            borderRadius: '6px',
                                            backgroundColor: '#2a1515',
                                            border: '1px solid #ff4444',
                                            color: '#ff6666',
                                            fontSize: '13px'
                                        }}>
                                            {firewallError}
                                        </div>
                                    )}
                                    <form onSubmit={handleSaveRule} style={{ display: 'grid', gap: '14px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>
                                                Action
                                            </label>
                                            <select
                                                name="action"
                                                value={firewallForm.action}
                                                onChange={handleFirewallChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: '#121212',
                                                    border: '1px solid #282828',
                                                    borderRadius: '6px',
                                                    color: '#fff'
                                                }}
                                            >
                                                <option value="allow">Allow</option>
                                                <option value="deny">Deny</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>
                                                Direction
                                            </label>
                                            <select
                                                name="direction"
                                                value={firewallForm.direction}
                                                onChange={handleFirewallChange}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: '#121212',
                                                    border: '1px solid #282828',
                                                    borderRadius: '6px',
                                                    color: '#fff'
                                                }}
                                            >
                                                <option value="inbound">Inbound</option>
                                                <option value="outbound">Outbound</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>
                                                IP Address (optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="ipAddress"
                                                value={firewallForm.ipAddress}
                                                onChange={handleFirewallChange}
                                                placeholder="e.g., 192.168.1.10"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: '#121212',
                                                    border: '1px solid #282828',
                                                    borderRadius: '6px',
                                                    color: '#fff'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>
                                                Port (optional)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="65535"
                                                name="port"
                                                value={firewallForm.port}
                                                onChange={handleFirewallChange}
                                                placeholder="e.g., 443"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: '#121212',
                                                    border: '1px solid #282828',
                                                    borderRadius: '6px',
                                                    color: '#fff'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>
                                                Description (optional)
                                            </label>
                                            <textarea
                                                name="description"
                                                value={firewallForm.description}
                                                onChange={handleFirewallChange}
                                                rows={3}
                                                placeholder="Describe the rule"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: '#121212',
                                                    border: '1px solid #282828',
                                                    borderRadius: '6px',
                                                    color: '#fff',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button
                                                type="button"
                                                onClick={resetFirewallForm}
                                                style={{
                                                    padding: '10px 16px',
                                                    backgroundColor: '#282828',
                                                    color: '#fff',
                                                    border: '1px solid #444',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={firewallLoading}
                                                style={{
                                                    padding: '10px 16px',
                                                    backgroundColor: '#36E27B',
                                                    color: '#121212',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {editingRuleId ? 'Update Rule' : 'Add Rule'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Rules List */}
                                <div style={{
                                    padding: '25px',
                                    backgroundColor: '#181818',
                                    border: '1px solid #282828',
                                    borderRadius: '10px'
                                }}>
                                    <h2 style={{ color: '#fff', marginTop: 0, marginBottom: '16px' }}>Your Rules</h2>
                                    {firewallLoading ? (
                                        <div style={{ color: '#888' }}>Loading rules...</div>
                                    ) : firewallRules.length === 0 ? (
                                        <div style={{ color: '#888' }}>No firewall rules yet. Add one using the form.</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {firewallRules.map((rule) => (
                                                <div key={rule.id} style={{
                                                    padding: '15px',
                                                    backgroundColor: '#121212',
                                                    border: '1px solid #282828',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    gap: '12px',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ display: 'grid', gap: '4px' }}>
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '12px',
                                                                backgroundColor: rule.action === 'allow' ? '#1E402C' : '#40201E',
                                                                color: rule.action === 'allow' ? '#36E27B' : '#FF7777',
                                                                border: rule.action === 'allow' ? '1px solid #36E27B' : '1px solid #FF7777',
                                                                fontSize: '12px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {rule.action.toUpperCase()}
                                                            </span>
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '12px',
                                                                backgroundColor: '#222',
                                                                color: '#fff',
                                                                border: '1px solid #333',
                                                                fontSize: '12px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {rule.direction.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div style={{ color: '#fff', fontSize: '14px' }}>
                                                            {rule.ipAddress ? `IP: ${rule.ipAddress}` : 'Any IP'} | {rule.port ? `Port: ${rule.port}` : 'Any Port'}
                                                        </div>
                                                        <div style={{ color: '#888', fontSize: '12px' }}>
                                                            {rule.description || 'No description'}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => handleEditRule(rule)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                backgroundColor: '#36E27B',
                                                                color: '#121212',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRule(rule.id)}
                                                            style={{
                                                                padding: '8px 12px',
                                                                backgroundColor: '#FF4444',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profiles View */}
                    {currentView === 'profiles' && (
                        <ProfileManager />
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

                            {/* Admin Statistics */}
                            {adminStats && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '20px',
                                    marginBottom: '30px'
                                }}>
                                    <div style={{
                                        padding: '20px',
                                        backgroundColor: '#181818',
                                        border: '1px solid #282828',
                                        borderRadius: '10px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>Total Users</div>
                                        <div style={{ fontSize: '24px', color: '#36E27B', fontWeight: 'bold' }}>
                                            {adminStats.users?.total || 0}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '20px',
                                        backgroundColor: '#181818',
                                        border: '1px solid #282828',
                                        borderRadius: '10px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>Pending Approvals</div>
                                        <div style={{ fontSize: '24px', color: '#FF9800', fontWeight: 'bold' }}>
                                            {adminStats.users?.pendingApprovals || 0}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '20px',
                                        backgroundColor: '#181818',
                                        border: '1px solid #282828',
                                        borderRadius: '10px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>Total Threats Blocked</div>
                                        <div style={{ fontSize: '24px', color: '#36E27B', fontWeight: 'bold' }}>
                                            {adminStats.threats?.totalBlocked || 0}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '20px',
                                        backgroundColor: '#181818',
                                        border: '1px solid #282828',
                                        borderRadius: '10px'
                                    }}>
                                        <div style={{ fontSize: '14px', color: '#888', marginBottom: '10px' }}>Application Health</div>
                                        <div style={{ fontSize: '24px', color: '#36E27B', fontWeight: 'bold' }}>
                                            {adminStats.applicationHealth?.status || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Users Table */}
                            <div style={{
                                padding: '25px',
                                backgroundColor: '#181818',
                                border: '1px solid #282828',
                                borderRadius: '10px'
                            }}>
                                <h2 style={{ color: '#fff', marginTop: 0, marginBottom: '20px' }}>All Users</h2>
                                {usersLoading ? (
                                    <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>Loading users...</div>
                                ) : users.length === 0 ? (
                                    <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No users found</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #282828' }}>
                                                    <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '600' }}>Email</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '600' }}>Role</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '600' }}>Status</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '600' }}>Created</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '600' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((u) => (
                                                    <tr key={u.id} style={{ borderBottom: '1px solid #282828' }}>
                                                        <td style={{ padding: '12px', color: '#fff' }}>{u.email}</td>
                                                        <td style={{ padding: '12px' }}>
                                                            <span style={{
                                                                padding: '4px 12px',
                                                                borderRadius: '12px',
                                                                fontSize: '12px',
                                                                backgroundColor: u.role === 'admin' ? '#1E402C' : '#282828',
                                                                color: u.role === 'admin' ? '#36E27B' : '#fff',
                                                                border: u.role === 'admin' ? '1px solid #36E27B' : '1px solid #444'
                                                            }}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px' }}>
                                                            <span style={{
                                                                color: u.isApproved ? '#36E27B' : '#FF9800'
                                                            }}>
                                                                {u.isApproved ? '✅ Approved' : '⏳ Pending'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px', color: '#888', fontSize: '14px' }}>
                                                            {new Date(u.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td style={{ padding: '12px' }}>
                                                            <button
                                                                onClick={() => handleEditUser(u)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    marginRight: '8px',
                                                                    backgroundColor: '#36E27B',
                                                                    color: '#121212',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600'
                                                                }}
                                                            >
                                                                Edit
                                                            </button>
                                                            {u.id !== user.id && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#FF4444',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        fontWeight: '600'
                                                                    }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Edit User Modal */}
                            {showEditModal && editingUser && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000
                                }}>
                                    <div style={{
                                        backgroundColor: '#181818',
                                        padding: '30px',
                                        borderRadius: '10px',
                                        border: '1px solid #282828',
                                        width: '90%',
                                        maxWidth: '500px'
                                    }}>
                                        <h2 style={{ color: '#fff', marginTop: 0 }}>Edit User</h2>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '14px' }}>Email</label>
                                            <input
                                                type="email"
                                                value={editingUser.email}
                                                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: '#121212',
                                                    border: '1px solid #282828',
                                                    borderRadius: '6px',
                                                    color: '#fff',
                                                    fontSize: '14px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '14px' }}>Role</label>
                                            <select
                                                value={editingUser.role}
                                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                                disabled={editingUser.id === user.id}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: '#121212',
                                                    border: '1px solid #282828',
                                                    borderRadius: '6px',
                                                    color: '#fff',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', color: '#888', fontSize: '14px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editingUser.isApproved}
                                                    onChange={(e) => setEditingUser({ ...editingUser, isApproved: e.target.checked })}
                                                    style={{
                                                        marginRight: '8px',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                Approved
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setShowEditModal(false);
                                                    setEditingUser(null);
                                                }}
                                                style={{
                                                    padding: '10px 20px',
                                                    backgroundColor: '#282828',
                                                    color: '#fff',
                                                    border: '1px solid #444',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveUser}
                                                style={{
                                                    padding: '10px 20px',
                                                    backgroundColor: '#36E27B',
                                                    color: '#121212',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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