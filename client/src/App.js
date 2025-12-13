import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { authAPI, dashboardAPI, adminAPI, getErrorMessage } from './services/api';
import './index.css';

// Custom Hooks
import { useTheme } from './hooks/useTheme';
import { useToastManager } from './hooks/useToastManager';
import { useScreenSize } from './hooks/useScreenSize';

// Layout Components
import Sidebar from './components/Layout/Sidebar';
import DashboardView from './components/Views/DashboardView';
import AdminUsersView from './components/Views/AdminUsersView';
import Toast from './components/Common/Toast';

// Feature Components
import ScanDashboard from './components/ScanDashboard';
import ProfileManager from './components/ProfileManager';
import FirewallRuleManagement from './components/FirewallRuleManagement';
import AdminAuditTrail from './components/AdminAuditTrail';
import SystemHealthMetrics from './components/SystemHealthMetrics';
import MFASettings from './components/MFASettings';
import DeviceInventory from './components/DeviceInventory';
import LoginHistory from './components/LoginHistory';
import FeatureToggles from './components/FeatureToggles';
import RoleTemplates from './components/RoleTemplates';
import UserImpersonation from './components/UserImpersonation';
import AdminNotifications from './components/AdminNotifications';
import ThreatBlocker from './components/ThreatBlocker';
import LogsAndReporting from './components/LogsAndReporting';

// Hierarchy Components
import Subscription from './components/Hierarchy/Subscription';
import GroupManagement from './components/Hierarchy/GroupManagement';
import Invitations from './components/Hierarchy/Invitations';
import Memberships from './components/Hierarchy/Memberships';

function App() {
    // Custom Hooks
    const { theme, setTheme, palette } = useTheme();
    const { toasts, showToast } = useToastManager();
    const { isMobile, isTablet } = useScreenSize();

    // UI State
    const initialView = (typeof window !== 'undefined' && localStorage.getItem('currentView')) || 'dashboard';
    const [activeTab, setActiveTab] = useState('login');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // User & Auth State
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState(initialView);

    // Dashboard State
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState(null);

    // Admin State
    const [users, setUsers] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);
    const [adminError, setAdminError] = useState(null);

    // User Management State
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editModalAnimating, setEditModalAnimating] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [userStatusFilter, setUserStatusFilter] = useState('all');

    // Close sidebar on mobile when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobile && sidebarOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.mobile-menu-button')) {
                setSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile, sidebarOpen]);

    // Auto-close sidebar on larger screens
    useEffect(() => {
        if (!isMobile && sidebarOpen) {
            setSidebarOpen(false);
        }
    }, [isMobile, sidebarOpen]);

    // Helper to fetch admin data (users + stats)
    const loadAdminData = useCallback(
        async (withLoading = true) => {
            if (!(user && user.role === 'admin' && currentView === 'users')) return;
            try {
                if (withLoading) setUsersLoading(true);
                setAdminError(null);
                const usersResponse = await adminAPI.getAllUsers();
                if (usersResponse.success) {
                    setUsers(usersResponse.data || []);
                } else {
                    setAdminError(usersResponse.message || 'Failed to load users');
                }
            } catch (error) {
                console.error('Admin data fetch error:', error);
                setAdminError(getErrorMessage(error, 'Failed to load users'));
            } finally {
                if (withLoading) setUsersLoading(false);
            }
        },
        [user, currentView]
    );

    // Auth Check
    useEffect(() => {
        const checkAuth = async () => {
            if (authAPI.isAuthenticated()) {
                try {
                    const currentUser = authAPI.getCurrentUser();
                    if (currentUser) setUser(currentUser);
                } catch (err) {
                    console.error('Auth check error:', err);
                    authAPI.logout();
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    // Persist currentView and validate for role
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('currentView', currentView);
        }
        if (user && user.role !== 'admin' && currentView === 'users') {
            setCurrentView('dashboard');
        }
    }, [currentView, user]);

    // Fetch dashboard data when user is logged in
    useEffect(() => {
        const fetchDashboard = async () => {
            if (user && currentView === 'dashboard') {
                try {
                    setDashboardLoading(true);
                    setDashboardError(null);
                    const response = await dashboardAPI.getDashboard();
                    if (response.success) {
                        setDashboardData(response.data);
                    } else {
                        setDashboardError(response.message || 'Failed to load dashboard data');
                    }
                } catch (error) {
                    console.error('Dashboard fetch error:', error);
                    setDashboardError(getErrorMessage(error, 'Failed to load dashboard data'));
                } finally {
                    setDashboardLoading(false);
                }
            }
        };
        fetchDashboard();
    }, [user, currentView]);

    // Admin Data Fetch
    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    // Admin User Management Handlers
    const handleEditUser = (userToEdit) => {
        setEditingUser({ ...userToEdit });
        setEditModalAnimating(true);
        setTimeout(() => {
            setShowEditModal(true);
        }, 10);
    };

    const closeEditModal = () => {
        setEditModalAnimating(false);
        setTimeout(() => {
            setShowEditModal(false);
            setEditingUser(null);
        }, 300);
    };

    const handleSaveUser = async () => {
        try {
            const res = await adminAPI.updateUser(editingUser.id, {
                email: editingUser.email,
                role: editingUser.role,
                isApproved: editingUser.isApproved
            });
            if (res.success) {
                setUsers(users.map(u => u.id === editingUser.id ? res.data : u));
                closeEditModal();
                await loadAdminData(false);
                showToast('User updated', 'success');
            }
        } catch (error) {
            console.error('Update user error:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to update user';
            showToast(msg, 'error');
            alert(msg);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const response = await adminAPI.deleteUser(id);
            if (response.success) {
                setUsers(users.filter(u => u.id !== id));
                await loadAdminData(false);
                showToast('User deleted', 'success');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to delete user';
            showToast(msg, 'error');
            alert(msg);
        }
    };

    const handleToggleUserStatus = async (u) => {
        if (u.id === user.id) {
            showToast('You cannot change your own status', 'error');
            return;
        }
        try {
            const response = await adminAPI.updateUser(u.id, {
                email: u.email,
                role: u.role,
                isApproved: !u.isApproved
            });
            if (response.success) {
                setUsers(prev => prev.map(x => x.id === u.id ? response.data : x));
                await loadAdminData(false);
                showToast(`User marked ${response.data.isApproved ? 'active' : 'inactive'}`, 'success');
            } else {
                showToast(response.message || 'Failed to update status', 'error');
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to update status';
            showToast(msg, 'error');
        }
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        authAPI.logout();
        setUser(null);
        setActiveTab('login');
        showToast('Logged out', 'info');
    };

    // Loading State
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: palette.bgMain,
                color: palette.accent,
                fontSize: '18px'
            }}>
                Loading...
            </div>
        );
    }

    // Authenticated UI
    if (user) {
        return (
            <>
                <div style={{
                    minHeight: '100vh',
                    backgroundColor: palette.bgMain,
                    color: palette.text,
                    display: 'flex'
                }}>
                    <Sidebar
                        user={user}
                        theme={theme}
                        palette={palette}
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        setTheme={setTheme}
                        isMobile={isMobile}
                        isTablet={isTablet}
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        handleLogout={handleLogout}
                    />

                    {/* HIERARCHY RENDER */}
                    {currentView === "subscription" && (
                        <Subscription
                            user={user}
                            onUpgradeSuccess={(updatedUser) => {
                                setUser(updatedUser);
                                localStorage.setItem("user", JSON.stringify(updatedUser));
                            }}
                        />
                    )}

                    {currentView === "groups" && user.accountType === "leader" && <GroupManagement user={user} />}
                    {currentView === "invitations" && <Invitations />}
                    {currentView === "memberships" && <Memberships />}

                    {/* Main Content */}
                    <div style={{
                        flex: 1,
                        padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
                        paddingTop: isMobile ? '64px' : (isTablet ? '24px' : '40px'),
                        overflowY: 'auto',
                        backgroundColor: palette.bgMain,
                        color: palette.text,
                        marginLeft: isMobile && sidebarOpen ? '260px' : '0',
                        transition: 'background-color 0.3s ease, color 0.3s ease, padding 0.3s ease, margin-left 0.3s ease, padding-top 0.3s ease'
                    }}>
                        {/* Dashboard View */}
                        {currentView === 'dashboard' && (
                            <DashboardView
                                user={user}
                                theme={theme}
                                palette={palette}
                                dashboardData={dashboardData}
                                dashboardLoading={dashboardLoading}
                                dashboardError={dashboardError}
                                isMobile={isMobile}
                                isTablet={isTablet}
                                setCurrentView={setCurrentView}
                            />
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
                                    <h1 style={{
                                        fontSize: isMobile ? '22px' : isTablet ? '28px' : '32px',
                                        margin: 0,
                                        paddingLeft: isMobile ? '48px' : '0',
                                        transition: 'padding-left 0.3s ease',
                                        flex: isMobile ? '1 1 100%' : 'none'
                                    }}>VPN Configurations</h1>
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
                                    backgroundColor: palette.bgCard,
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
                            <FirewallRuleManagement theme={theme} palette={palette} />
                        )}

                        {/* Profiles View */}
                        {currentView === 'profiles' && (
                            <ProfileManager theme={theme} palette={palette} />
                        )}

                        {/* Scan View */}
                        {currentView === 'scan' && (
                            <ScanDashboard theme={theme} palette={palette} />
                        )}

                        {/* Audit View */}
                        {currentView === 'audit' && user.role === 'admin' && (
                            <AdminAuditTrail theme={theme} palette={palette} />
                        )}

                        {/* System Health View */}
                        {currentView === 'system-health' && user.role === 'admin' && (
                            <SystemHealthMetrics theme={theme} palette={palette} />
                        )}

                        {/* MFA View */}
                        {currentView === 'mfa' && user.role === 'admin' && (
                            <MFASettings theme={theme} palette={palette} />
                        )}

                        {/* Devices View */}
                        {currentView === 'devices' && user.role === 'admin' && (
                            <DeviceInventory theme={theme} palette={palette} />
                        )}

                        {/* Login History View */}
                        {currentView === 'login-history' && user.role === 'admin' && (
                            <LoginHistory theme={theme} palette={palette} />
                        )}

                        {/* Feature Toggles View */}
                        {currentView === 'feature-toggles' && user.role === 'admin' && (
                            <FeatureToggles theme={theme} palette={palette} />
                        )}

                        {/* Role Templates View */}
                        {currentView === 'role-templates' && user.role === 'admin' && (
                            <RoleTemplates theme={theme} palette={palette} />
                        )}

                        {/* Impersonation View */}
                        {currentView === 'impersonation' && user.role === 'admin' && (
                            <UserImpersonation theme={theme} palette={palette} />
                        )}

                        {/* Admin Notifications View */}
                        {currentView === 'admin-notifications' && user.role === 'admin' && (
                            <AdminNotifications theme={theme} palette={palette} />
                        )}

                        {/* Threat Blocker View */}
                        {currentView === 'threat-blocker' && (
                            <ThreatBlocker theme={theme} palette={palette} />
                        )}

                        {/* Activity Logs View */}
                        {currentView === 'activity-logs' && (
                            <LogsAndReporting theme={theme} palette={palette} />
                        )}

                        {/* Admin Users View */}
                        {currentView === 'users' && user.role === 'admin' && (
                            <AdminUsersView
                                user={user}
                                theme={theme}
                                palette={palette}
                                users={users}
                                usersLoading={usersLoading}
                                adminError={adminError}
                                isMobile={isMobile}
                                isTablet={isTablet}
                                editingUser={editingUser}
                                setEditingUser={setEditingUser}
                                showEditModal={showEditModal}
                                setShowEditModal={setShowEditModal}
                                editModalAnimating={editModalAnimating}
                                userSearchQuery={userSearchQuery}
                                setUserSearchQuery={setUserSearchQuery}
                                userRoleFilter={userRoleFilter}
                                setUserRoleFilter={setUserRoleFilter}
                                userStatusFilter={userStatusFilter}
                                setUserStatusFilter={setUserStatusFilter}
                                handleEditUser={handleEditUser}
                                handleDeleteUser={handleDeleteUser}
                                handleToggleUserStatus={handleToggleUserStatus}
                                handleSaveUser={handleSaveUser}
                                closeEditModal={closeEditModal}
                            />
                        )}
                    </div>
                </div>

                {/* Toast Component */}
                <Toast toasts={toasts} palette={palette} />
            </>
        );
    }

    // Login/Register UI
    return (
        <>
            <div className="app-container" style={{ backgroundColor: palette.bgMain, color: palette.text }}>
                <div className="auth-container" style={{ backgroundColor: palette.bgCard, color: palette.text }}>
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

            {/* Toast Component */}
            <Toast toasts={toasts} palette={palette} />
        </>
    );
}

export default App;
