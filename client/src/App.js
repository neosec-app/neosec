import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { authAPI, dashboardAPI, adminAPI, firewallAPI, vpnAPI } from './services/api';
import './index.css';
import ProfileManager from './components/ProfileManager';
import ScanDashboard from './components/ScanDashboard';
import { SiAlwaysdata } from 'react-icons/si';
import { GoAlertFill } from 'react-icons/go';
import { MdModeEdit } from 'react-icons/md';
import { SlReload } from 'react-icons/sl';
import { RiDeleteBin6Line } from 'react-icons/ri';

function App() {
    // Theme
    const initialTheme = (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'dark';
    const [theme, setTheme] = useState(initialTheme); // 'dark' | 'light'
    const themeVars = {
        // Keep dark close to original green tone
        dark: {
            bgMain: '#121212',
            bgCard: '#181818',
            bgPanel: '#0a0a0a',
            text: '#ffffff',
            textMuted: '#9aa3b5',
            border: '#242424',
            accent: '#36E27B',
            accentSoft: 'rgba(54,226,123,0.12)',
            warning: '#f0a500',
            danger: '#e04848',
            inputBg: '#1c1c1c',
            inputBorder: '#2c2c2c'
        },
        // Light theme aligned to Figma green style
        light: {
            bgMain: '#f6f8fb',          // soft gray-blue background
            bgCard: '#ffffff',          // white cards
            bgPanel: '#eef3f8',         // slightly tinted panel
            text: '#0b172a',            // deep navy text
            textMuted: '#5b6b7a',       // muted gray-blue
            border: '#d9e2ec',          // subtle border
            accent: '#1fa45a',          // green primary
            accentSoft: '#e6f4ed',      // light green tint
            warning: '#d97706',
            danger: '#d4183d',
            inputBg: '#ffffff',
            inputBorder: '#d9e2ec'
        }
    };
    const palette = themeVars[theme];

    useEffect(() => {
        // Smooth theme transition
        document.documentElement.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : 'light');
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        document.body.style.backgroundColor = palette.bgMain;
        document.body.style.color = palette.text;
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', theme);
        }
    }, [theme, palette]);

    // Toasts
    const [toasts, setToasts] = useState([]);
    const showToast = (message, type = 'info') => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
    };

    const cardShadow = theme === 'light' ? '0 12px 30px rgba(17, 24, 39, 0.08)' : 'none';
    const cardBorder = `1px solid ${palette.border}`;
    const cardBase = {
        backgroundColor: palette.bgCard,
        borderRadius: 14,
        border: cardBorder,
        boxShadow: cardShadow,
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
    };

    const initialView = (typeof window !== 'undefined' && localStorage.getItem('currentView')) || 'dashboard';
    const [activeTab, setActiveTab] = useState('login');
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Track screen size for responsive behavior
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
            if (width >= 768) {
                setSidebarOpen(false); // Auto-close sidebar on larger screens
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState(initialView); // dashboard, vpn, firewall, profiles
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editModalAnimating, setEditModalAnimating] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [userStatusFilter, setUserStatusFilter] = useState('all');
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [firewallRules, setFirewallRules] = useState([]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.custom-dropdown')) {
                setRoleDropdownOpen(false);
                setStatusDropdownOpen(false);
            }
            // Close sidebar on mobile when clicking outside
            if (isMobile && sidebarOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.mobile-menu-button')) {
                setSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile, sidebarOpen]);
    const [firewallLoading, setFirewallLoading] = useState(false);
    const [firewallError, setFirewallError] = useState('');
    const [editingRuleId, setEditingRuleId] = useState(null);
    const [confirmDeleteRuleId, setConfirmDeleteRuleId] = useState(null);
    const [navHover, setNavHover] = useState(null);
    const [logoutHover, setLogoutHover] = useState(false);
    const [actionButtonHover, setActionButtonHover] = useState(null); // Track hovered action button: 'reset-{id}', 'edit-{id}', 'delete-{id}', etc.
    const [showFirewallModal, setShowFirewallModal] = useState(false);
    const [firewallModalAnimating, setFirewallModalAnimating] = useState(false);
    const initialFirewallForm = {
        action: 'allow',
        direction: 'inbound',
        protocol: 'tcp',
        sourceIPType: 'any', // 'any', 'specific', 'range'
        sourceIP: '',
        destinationIPType: 'any',
        destinationIP: '',
        sourcePortType: 'any', // 'any', 'specific', 'range'
        sourcePort: '',
        destinationPortType: 'any',
        destinationPort: '',
        description: '',
        enabled: true
    };
    const [firewallForm, setFirewallForm] = useState(initialFirewallForm);

    // Helper to fetch admin data (users + stats)
    const loadAdminData = useCallback(
        async (withLoading = true) => {
            if (!(user && user.role === 'admin' && currentView === 'users')) return;
            try {
                if (withLoading) setUsersLoading(true);
                const usersResponse = await adminAPI.getAllUsers();
                if (usersResponse.success) {
                    setUsers(usersResponse.data || []);
                }
            } catch (error) {
                console.error('Admin data fetch error:', error);
            } finally {
                if (withLoading) setUsersLoading(false);
            }
        },
        [user, currentView]
    );

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

    // Persist currentView and validate for role
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('currentView', currentView);
        }
        // If user is not admin, avoid admin-only views
        if (user && user.role !== 'admin' && currentView === 'users') {
            setCurrentView('dashboard');
        }
    }, [currentView, user]);

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
        loadAdminData();
    }, [loadAdminData]);

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
            const response = await adminAPI.updateUser(editingUser.id, {
                email: editingUser.email,
                role: editingUser.role,
                isApproved: editingUser.isApproved
            });
            if (response.success) {
                setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
                closeEditModal();
                // Refresh stats (e.g., pending approvals) without full page refresh
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

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }
        try {
            const response = await adminAPI.deleteUser(userId);
            if (response.success) {
                setUsers(users.filter(u => u.id !== userId));
                // Refresh stats after delete
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

    // Toggle user approval status
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

    // Firewall handlers
    const clearFirewallForm = () => {
        setFirewallForm(initialFirewallForm);
        setEditingRuleId(null);
    };

    const resetFirewallForm = () => {
        closeFirewallModal();
    };

    const closeFirewallModal = () => {
        // Animate out before closing
        setFirewallModalAnimating(false);
        setTimeout(() => {
            clearFirewallForm();
            setShowFirewallModal(false);
        }, 200);
    };

    const openFirewallModal = () => {
        clearFirewallForm();
        setShowFirewallModal(true);
        setFirewallModalAnimating(false);
        // Trigger animation after mount
        setTimeout(() => setFirewallModalAnimating(true), 10);
    };

    const openFirewallModalForEdit = () => {
        setShowFirewallModal(true);
        setFirewallModalAnimating(false);
        setTimeout(() => setFirewallModalAnimating(true), 10);
    };

    const handleFirewallChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFirewallForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveRule = async (e) => {
        e.preventDefault();
        setFirewallError('');
        setFirewallLoading(true);
        try {
            const payload = {
                action: firewallForm.action,
                direction: firewallForm.direction,
                protocol: firewallForm.protocol,
                sourceIP: firewallForm.sourceIPType === 'any' ? null : (firewallForm.sourceIP || null),
                destinationIP: firewallForm.destinationIPType === 'any' ? null : (firewallForm.destinationIP || null),
                sourcePort: firewallForm.sourcePortType === 'any' ? null : (firewallForm.sourcePort || null),
                destinationPort: firewallForm.destinationPortType === 'any' ? null : (firewallForm.destinationPort || null),
                description: firewallForm.description || null,
                enabled: firewallForm.enabled
            };

            let response;
            if (editingRuleId) {
                response = await firewallAPI.updateRule(editingRuleId, payload);
                if (response.success) {
                    setFirewallRules((prev) =>
                        prev.map((rule) => (rule.id === editingRuleId ? response.data : rule))
                    );
                    showToast('Firewall rule updated', 'success');
                }
            } else {
                response = await firewallAPI.createRule(payload);
                if (response.success) {
                    setFirewallRules((prev) => [response.data, ...prev]);
                    showToast('Firewall rule added', 'success');
                }
            }

            if (!response?.success) {
                setFirewallError(response?.message || 'Failed to save firewall rule');
                showToast(response?.message || 'Failed to save firewall rule', 'error');
                return;
            }

            resetFirewallForm();
        } catch (error) {
            console.error('Save firewall rule error:', error);
            const msg = error.response?.data?.message || 'Failed to save firewall rule';
            setFirewallError(msg);
            showToast(msg, 'error');
        } finally {
            setFirewallLoading(false);
        }
    };

    const handleEditRule = (rule) => {
        setEditingRuleId(rule.id);
        setFirewallForm({
            action: rule.action,
            direction: rule.direction,
            protocol: (rule.protocol === 'tcp' || rule.protocol === 'udp') ? rule.protocol : 'tcp',
            sourceIPType: rule.sourceIP ? (rule.sourceIP.includes('/') ? 'range' : 'specific') : 'any',
            sourceIP: rule.sourceIP || '',
            destinationIPType: rule.destinationIP ? (rule.destinationIP.includes('/') ? 'range' : 'specific') : 'any',
            destinationIP: rule.destinationIP || '',
            sourcePortType: rule.sourcePort ? (rule.sourcePort.includes('-') ? 'range' : 'specific') : 'any',
            sourcePort: rule.sourcePort || '',
            destinationPortType: rule.destinationPort ? (rule.destinationPort.includes('-') ? 'range' : 'specific') : 'any',
            destinationPort: rule.destinationPort || '',
            description: rule.description || '',
            enabled: rule.enabled !== undefined ? rule.enabled : true
        });
        openFirewallModalForEdit();
    };

    const handleDeleteRule = (id) => {
        setConfirmDeleteRuleId(id);
    };

    const confirmDeleteRule = async () => {
        if (!confirmDeleteRuleId) return;
        setFirewallError('');
        try {
            const response = await firewallAPI.deleteRule(confirmDeleteRuleId);
            if (response.success) {
                setFirewallRules((prev) => prev.filter((rule) => rule.id !== confirmDeleteRuleId));
                showToast('Firewall rule deleted', 'success');
            } else {
                setFirewallError(response.message || 'Failed to delete firewall rule');
                showToast(response.message || 'Failed to delete firewall rule', 'error');
            }
        } catch (error) {
            console.error('Delete firewall rule error:', error);
            const msg = error.response?.data?.message || 'Failed to delete firewall rule';
            setFirewallError(msg);
            showToast(msg, 'error');
        } finally {
            setConfirmDeleteRuleId(null);
        }
    };

    // Move rule up (decrease order)
    const handleMoveRuleUp = async (ruleId, currentIndex) => {
        if (currentIndex === 0) return;
        try {
            setFirewallLoading(true);
            const currentRule = firewallRules[currentIndex];
            const previousRule = firewallRules[currentIndex - 1];

            // Get current orders or use index as fallback
            const currentOrder = currentRule.order !== undefined ? currentRule.order : currentIndex;
            const previousOrder = previousRule.order !== undefined ? previousRule.order : currentIndex - 1;

            // Swap orders - current rule gets previous order, previous rule gets current order
            await Promise.all([
                firewallAPI.updateRule(currentRule.id, { order: previousOrder }),
                firewallAPI.updateRule(previousRule.id, { order: currentOrder })
            ]);

            // Refresh rules list
            const response = await firewallAPI.getRules();
            if (response.success) {
                setFirewallRules(response.data || []);
                showToast('Rule moved up', 'success');
            }
        } catch (error) {
            console.error('Move rule up error:', error);
            const msg = error.response?.data?.message || 'Failed to move rule';
            showToast(msg, 'error');
        } finally {
            setFirewallLoading(false);
        }
    };

    // Move rule down (increase order)
    const handleMoveRuleDown = async (ruleId, currentIndex) => {
        if (currentIndex === firewallRules.length - 1) return;
        try {
            setFirewallLoading(true);
            const currentRule = firewallRules[currentIndex];
            const nextRule = firewallRules[currentIndex + 1];

            // Get current orders or use index as fallback
            const currentOrder = currentRule.order !== undefined ? currentRule.order : currentIndex;
            const nextOrder = nextRule.order !== undefined ? nextRule.order : currentIndex + 1;

            // Swap orders - current rule gets next order, next rule gets current order
            await Promise.all([
                firewallAPI.updateRule(currentRule.id, { order: nextOrder }),
                firewallAPI.updateRule(nextRule.id, { order: currentOrder })
            ]);

            // Refresh rules list
            const response = await firewallAPI.getRules();
            if (response.success) {
                setFirewallRules(response.data || []);
                showToast('Rule moved down', 'success');
            }
        } catch (error) {
            console.error('Move rule down error:', error);
            const msg = error.response?.data?.message || 'Failed to move rule';
            showToast(msg, 'error');
        } finally {
            setFirewallLoading(false);
        }
    };

    // Reset/Refresh rule (reload from server)
    const handleResetRule = async (ruleId) => {
        try {
            const response = await firewallAPI.getRules();
            if (response.success) {
                const updatedRule = response.data.find(r => r.id === ruleId);
                if (updatedRule) {
                    setFirewallRules((prev) =>
                        prev.map((rule) => rule.id === ruleId ? updatedRule : rule)
                    );
                    showToast('Rule refreshed', 'success');
                }
            }
        } catch (error) {
            console.error('Reset rule error:', error);
            showToast('Failed to refresh rule', 'error');
        }
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        showToast('Login successful', 'success');
    };

    const handleLogout = () => {
        authAPI.logout();
        setUser(null);
        setActiveTab('login');
        showToast('Logged out', 'info');
    };

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

    // If user is logged in, show dashboard
    if (user) {
        return (
            <>
                <div style={{
                    minHeight: '100vh',
                    backgroundColor: palette.bgMain,
                    color: palette.text,
                    display: 'flex'
                }}>
                    {/* Mobile Menu Button */}
                    {isMobile && !sidebarOpen && (
                        <button
                            className="mobile-menu-button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{
                                position: 'fixed',
                                top: '12px',
                                left: '12px',
                                zIndex: 1001,
                                padding: '10px',
                                backgroundColor: palette.bgCard,
                                border: `1px solid ${palette.border}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                width: '40px',
                                height: '40px'
                            }}
                        >
                            <span style={{ fontSize: '18px', color: palette.text }}>☰</span>
                        </button>
                    )}

                    {/* Mobile Sidebar Backdrop */}
                    {isMobile && sidebarOpen && (
                        <div
                            onClick={() => setSidebarOpen(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                zIndex: 999,
                                transition: 'opacity 0.3s ease'
                            }}
                        />
                    )}

                    {/* Sidebar */}
                    <div className="sidebar-container" style={{
                        width: isMobile ? (sidebarOpen ? '260px' : '0') : '260px',
                        backgroundColor: palette.bgPanel,
                        padding: isMobile && !sidebarOpen ? '0' : '20px',
                        borderRight: `1px solid ${palette.border}`,
                        transition: 'all 0.3s ease',
                        overflow: isMobile && !sidebarOpen ? 'hidden' : 'visible',
                        position: isMobile ? 'fixed' : 'relative',
                        height: isMobile ? '100vh' : 'auto',
                        zIndex: isMobile ? 1000 : 'auto',
                        left: isMobile && !sidebarOpen ? '-260px' : '0',
                        top: isMobile ? '0' : 'auto',
                        boxShadow: isMobile && sidebarOpen ? '4px 0 12px rgba(0,0,0,0.15)' : 'none'
                    }}>
                        {isMobile && sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    padding: '4px 8px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: palette.text,
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        )}
                        <div style={{
                            marginBottom: '40px',
                            paddingBottom: '20px',
                            borderBottom: `1px solid ${palette.border}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            paddingTop: isMobile && sidebarOpen ? '8px' : '0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '4px',
                                    background: theme === 'dark' ? '#7c8bff' : '#030213'
                                }} />
                                <h2 style={{
                                    color: palette.accent,
                                    margin: 0,
                                    fontSize: isMobile ? '18px' : '20px',
                                    letterSpacing: '0.2px'
                                }}>NeoSec</h2>
                            </div>
                            <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: palette.textMuted
                            }}>{user.email}</p>
                            <span style={{
                                display: 'inline-block',
                                marginTop: '10px',
                                padding: '5px 12px',
                                borderRadius: '15px',
                                fontSize: '12px',
                                backgroundColor: user.role === 'admin' ? palette.accentSoft : palette.bgPanel,
                                color: user.role === 'admin' ? palette.accent : palette.text,
                                border: user.role === 'admin' ? `1px solid ${palette.accent}` : `1px solid ${palette.border}`
                            }}>
                                {user.role === 'admin' ? ' Admin' : ' User'}
                            </span>
                            <div style={{
                                marginTop: '4px',
                                alignSelf: 'flex-start',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '12px', color: palette.textMuted }}>Theme</span>
                                <label style={{
                                    position: 'relative',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={theme === 'dark'}
                                        onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={{
                                        width: '46px',
                                        height: '24px',
                                        backgroundColor: theme === 'dark' ? palette.accent : palette.border,
                                        borderRadius: '999px',
                                        position: 'relative',
                                        transition: 'all 0.2s'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            top: '3px',
                                            left: theme === 'dark' ? '24px' : '3px',
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            backgroundColor: theme === 'dark' ? '#fff' : palette.text,
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                        }} />
                                    </span>
                                </label>
                                <span style={{ fontSize: '12px', color: palette.textMuted }}>
                                    {theme === 'dark' ? 'Dark' : 'Light'}
                                </span>
                            </div>
                        </div>

                        <nav>
                            <button
                                onMouseEnter={() => setNavHover('dashboard')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('dashboard')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'dashboard' || navHover === 'dashboard' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'dashboard' || navHover === 'dashboard' ? palette.accent : palette.text,
                                    border: currentView === 'dashboard' || navHover === 'dashboard' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'dashboard' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Dashboard
                            </button>

                            <button
                                onMouseEnter={() => setNavHover('vpn')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('vpn')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'vpn' || navHover === 'vpn' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'vpn' || navHover === 'vpn' ? palette.accent : palette.text,
                                    border: currentView === 'vpn' || navHover === 'vpn' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'vpn' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                VPN Configurations
                            </button>

                            <button
                                onMouseEnter={() => setNavHover('firewall')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('firewall')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'firewall' || navHover === 'firewall' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'firewall' || navHover === 'firewall' ? palette.accent : palette.text,
                                    border: currentView === 'firewall' || navHover === 'firewall' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'firewall' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Firewall Rules
                            </button>

                            <button
                                onMouseEnter={() => setNavHover('profiles')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('profiles')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'profiles' || navHover === 'profiles' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'profiles' || navHover === 'profiles' ? palette.accent : palette.text,
                                    border: currentView === 'profiles' || navHover === 'profiles' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'profiles' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Security Profiles
                            </button>

                            {user.role === 'admin' && (
                                <button
                                    onMouseEnter={() => setNavHover('users')}
                                    onMouseLeave={() => setNavHover(null)}
                                    onClick={() => setCurrentView('users')}
                                    style={{
                                        width: '100%',
                                        padding: '12px 15px',
                                        marginBottom: '10px',
                                        backgroundColor: currentView === 'users' || navHover === 'users' ? palette.accentSoft : 'transparent',
                                        color: currentView === 'users' || navHover === 'users' ? palette.accent : palette.text,
                                        border: currentView === 'users' || navHover === 'users' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                        borderRadius: '10px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        transition: 'all 0.15s ease',
                                        boxShadow: navHover === 'users' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                    }}
                                >
                                    User Management
                                </button>
                            )}
                        </nav>

                        <button
                            onClick={handleLogout}
                            onMouseEnter={() => setLogoutHover(true)}
                            onMouseLeave={() => setLogoutHover(false)}
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                marginTop: '30px',
                                backgroundColor: logoutHover
                                    ? (theme === 'dark' ? 'rgba(54,226,123,0.2)' : 'rgba(31,164,90,0.15)')
                                    : palette.accentSoft,
                                color: logoutHover ? palette.accent : palette.text,
                                border: logoutHover
                                    ? `1px solid ${palette.accent}`
                                    : `1px solid ${palette.border}`,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: logoutHover ? 600 : 500,
                                transition: 'all 0.15s ease',
                                boxShadow: logoutHover ? '0 6px 14px rgba(0,0,0,0.08)' : 'none',
                                transform: logoutHover ? 'translateY(-1px)' : 'translateY(0)'
                            }}
                        >
                            Logout
                        </button>
                    </div>

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
                            <div>
                                <h1 style={{
                                    fontSize: isMobile ? '20px' : '24px',
                                    marginBottom: isMobile ? '20px' : '30px',
                                    marginTop: 0,
                                    color: palette.text,
                                    fontWeight: 600,
                                    paddingLeft: isMobile ? '48px' : '0',
                                    transition: 'padding-left 0.3s ease'
                                }}>User Dashboard</h1>

                                {!user.isApproved && (
                                    <div style={{
                                        padding: '18px',
                                        backgroundColor: palette.accentSoft,
                                        border: `1px solid ${palette.warning}`,
                                        borderRadius: '12px',
                                        marginBottom: '24px'
                                    }}>
                                        <strong style={{ color: palette.warning }}>⚠️ Account Pending Approval</strong>
                                        <p style={{ margin: '8px 0 0 0', color: palette.textMuted }}>
                                            Your account is awaiting admin approval. Some features may be restricted.
                                        </p>
                                    </div>
                                )}

                                {/* Dashboard Grid - 3 columns on desktop, 1 on mobile */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr 1fr' : '1fr 1fr 1fr'),
                                    gap: isMobile ? '16px' : '24px',
                                    marginBottom: isMobile ? '16px' : '24px'
                                }}>
                                    {/* VPN Connection Status Card - Spans 2 columns on desktop */}
                                    <div style={{
                                        ...cardBase,
                                        padding: isMobile ? '16px' : '24px',
                                        position: 'relative',
                                        gridColumn: isMobile ? '1' : (isTablet ? '1 / 3' : '1 / 3'),
                                        backgroundColor: dashboardData?.vpnStatus?.connected
                                            ? (theme === 'light' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(54, 226, 123, 0.12)')
                                            : palette.bgCard,
                                        border: dashboardData?.vpnStatus?.connected && theme === 'light'
                                            ? '1px solid rgba(34, 197, 94, 0.2)'
                                            : `1px solid ${palette.border}`
                                    }}>
                                        <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                                            <p style={{
                                                fontSize: isMobile ? '13px' : '14px',
                                                color: palette.textMuted,
                                                margin: 0,
                                                marginBottom: '4px'
                                            }}>
                                                VPN Connection Status
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {dashboardLoading ? (
                                                        <div style={{ fontSize: '14px', color: palette.textMuted }}>Loading...</div>
                                                    ) : dashboardData?.vpnStatus?.connected ? (
                                                        <>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                backgroundColor: palette.accent,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}>
                                                                <span style={{ fontSize: '20px', color: theme === 'dark' ? '#121212' : '#fff', fontWeight: 'bold', lineHeight: 1 }}>✓</span>
                                                            </div>
                                                            <span style={{ fontSize: isMobile ? '16px' : '18px', color: palette.accent, fontWeight: 600 }}>Connected</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                border: `3px solid ${palette.danger}`,
                                                                backgroundColor: 'transparent',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}>
                                                                <span style={{ fontSize: '20px', color: palette.danger, fontWeight: 'bold', lineHeight: 1 }}>✕</span>
                                                            </div>
                                                            <span style={{ fontSize: isMobile ? '16px' : '18px', color: palette.danger, fontWeight: 600 }}>Disconnected</span>
                                                        </>
                                                    )}
                                                </div>
                                                {dashboardData?.vpnStatus?.connected && (
                                                    <button
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: 'transparent',
                                                            color: palette.text,
                                                            border: `1px solid ${palette.border}`,
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px',
                                                            fontWeight: 500,
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.backgroundColor = theme === 'light' ? '#f3f4f6' : palette.bgPanel;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.backgroundColor = 'transparent';
                                                        }}
                                                        onClick={() => {
                                                            if (dashboardData?.vpnStatus?.configId) {
                                                                vpnAPI.toggleVpnConfig(dashboardData.vpnStatus.configId);
                                                            }
                                                        }}
                                                    >
                                                        Disconnect
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {dashboardData?.vpnStatus?.connected && !dashboardLoading && (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: palette.textMuted, marginBottom: '16px' }}>
                                                    <SiAlwaysdata style={{ fontSize: '16px', color: palette.accent }} />
                                                    <span>Active Profile: <span style={{ color: palette.text }}>{dashboardData?.vpnStatus?.configName || dashboardData?.activeProfile?.name || 'Unknown'}</span></span>
                                                </div>
                                                <div style={{
                                                    marginTop: '16px',
                                                    paddingTop: '16px',
                                                    borderTop: theme === 'light' && dashboardData?.vpnStatus?.connected
                                                        ? '1px solid rgba(34, 197, 94, 0.2)'
                                                        : `1px solid ${palette.border}`
                                                }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                                        gap: isMobile ? '12px' : '16px',
                                                        fontSize: '13px'
                                                    }}>
                                                        <div>
                                                            <p style={{ color: palette.textMuted, margin: '0 0 4px 0', fontSize: '13px' }}>Server Location</p>
                                                            <p style={{ color: palette.text, margin: 0, fontWeight: 500 }}>{dashboardData?.vpnStatus?.serverLocation || dashboardData?.vpnStatus?.server || 'Unknown'}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ color: palette.textMuted, margin: '0 0 4px 0', fontSize: '13px' }}>IP Address</p>
                                                            <p style={{ color: palette.text, margin: 0, fontWeight: 500 }}>{dashboardData?.vpnStatus?.ipAddress || 'Not assigned'}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ color: palette.textMuted, margin: '0 0 4px 0', fontSize: '13px' }}>Connection Time</p>
                                                            <p style={{ color: palette.text, margin: 0, fontWeight: 500 }}>{dashboardData?.vpnStatus?.connectionTime || '0h 0m'}</p>
                                                        </div>
                                                        <div>
                                                            <p style={{ color: palette.textMuted, margin: '0 0 4px 0', fontSize: '13px' }}>Protocol</p>
                                                            <p style={{ color: palette.text, margin: 0, fontWeight: 500 }}>{dashboardData?.vpnStatus?.protocol || 'Unknown'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Threat Summary Card */}
                                    <div style={{ ...cardBase, padding: isMobile ? '16px' : '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '16px' : '20px' }}>
                                            <GoAlertFill style={{ fontSize: isMobile ? '18px' : '20px', color: palette.warning }} />
                                            <h2 style={{ fontSize: isMobile ? '16px' : '18px', margin: 0, color: palette.text, fontWeight: 600 }}>
                                                Threat Summary
                                            </h2>
                                        </div>
                                        {dashboardLoading ? (
                                            <div style={{ fontSize: '14px', color: palette.textMuted }}>Loading...</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: isMobile ? '28px' : '32px', color: palette.text, fontWeight: 'bold' }}>
                                                            {dashboardData?.threatsBlocked?.thisWeek || 0}
                                                        </span>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '13px',
                                                            color: palette.accent,
                                                            fontWeight: 500
                                                        }}>
                                                            <span style={{ fontSize: '12px' }}>⇗</span>
                                                            <span>{Math.abs(dashboardData?.threatsBlocked?.percentageChange || 0)}%</span>
                                                        </div>
                                                    </div>
                                                    <p style={{ fontSize: '13px', color: palette.textMuted, margin: 0 }}>
                                                        Blocked Threats This Week
                                                    </p>
                                                </div>
                                                <div style={{
                                                    height: '1px',
                                                    backgroundColor: theme === 'light' ? '#e5e7eb' : palette.border,
                                                    margin: '4px 0'
                                                }}></div>
                                                <div>
                                                    <div style={{ fontSize: isMobile ? '18px' : '20px', color: palette.text, fontWeight: 'bold', marginBottom: '4px' }}>
                                                        {(dashboardData?.threatsBlocked?.totalBlockedIPs || 0).toLocaleString()}
                                                    </div>
                                                    <p style={{ fontSize: '13px', color: palette.textMuted, margin: 0 }}>
                                                        Total Blocked IPs
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Data Transfer Card */}
                                    <div style={{ ...cardBase, padding: isMobile ? '16px' : '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '16px' : '20px' }}>
                                            <SiAlwaysdata style={{ fontSize: isMobile ? '18px' : '20px', color: palette.accent }} />
                                            <h2 style={{ fontSize: isMobile ? '16px' : '18px', margin: 0, color: palette.text, fontWeight: 600 }}>
                                                Data Transfer
                                            </h2>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: palette.textMuted }}>
                                                        <span style={{ fontSize: '14px' }}>⇗</span>
                                                        <span>Data Sent</span>
                                                    </div>
                                                    <span style={{ fontSize: '14px', color: palette.text, fontWeight: 600 }}>
                                                        {dashboardLoading ? '...' : `${dashboardData?.dataTransfer?.gbSent || 0} GB`}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    width: '100%',
                                                    height: '8px',
                                                    backgroundColor: theme === 'light' ? '#e5e7eb' : '#2a2a2a',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${dashboardData?.dataTransfer?.sentPercentage || 0}%`,
                                                        height: '100%',
                                                        backgroundColor: palette.accent,
                                                        borderRadius: '4px',
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: palette.textMuted }}>
                                                        <span style={{ fontSize: '14px' }}>⇘</span>
                                                        <span>Data Received</span>
                                                    </div>
                                                    <span style={{ fontSize: '14px', color: palette.text, fontWeight: 600 }}>
                                                        {dashboardLoading ? '...' : `${dashboardData?.dataTransfer?.gbReceived || 0} GB`}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    width: '100%',
                                                    height: '8px',
                                                    backgroundColor: theme === 'light' ? '#e5e7eb' : '#2a2a2a',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${dashboardData?.dataTransfer?.receivedPercentage || 0}%`,
                                                        height: '100%',
                                                        backgroundColor: palette.accent,
                                                        borderRadius: '4px',
                                                        transition: 'width 0.3s ease'
                                                    }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Active Profile Card */}
                                    <div style={{ ...cardBase, padding: isMobile ? '16px' : '24px' }}>
                                        <h2 style={{ fontSize: isMobile ? '16px' : '18px', margin: '0 0 16px 0', color: palette.text, fontWeight: 600 }}>
                                            Active Profile
                                        </h2>
                                        {dashboardData?.activeProfile ? (
                                            <>
                                                <div style={{
                                                    padding: '16px',
                                                    backgroundColor: theme === 'light' ? '#f9fafb' : palette.bgPanel,
                                                    border: `1px solid ${palette.border}`,
                                                    borderRadius: '8px',
                                                    marginBottom: '16px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '16px', color: palette.text, fontWeight: 600 }}>
                                                            {dashboardData.activeProfile.name}
                                                        </span>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            backgroundColor: theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : palette.accentSoft,
                                                            color: palette.accent,
                                                            border: `1px solid ${palette.accent}`,
                                                            fontWeight: 600
                                                        }}>
                                                            Active
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '13px', color: palette.textMuted, margin: 0 }}>
                                                        {dashboardData.activeProfile.description}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setCurrentView('profiles')}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        backgroundColor: 'transparent',
                                                        color: palette.text,
                                                        border: `1px solid ${palette.border}`,
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 500,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor = theme === 'light' ? '#f3f4f6' : palette.bgPanel;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    View/Manage Profiles
                                                </button>
                                            </>
                                        ) : (
                                            <div style={{ color: palette.textMuted, fontSize: '14px' }}>
                                                No active profile. <button
                                                    onClick={() => setCurrentView('profiles')}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: palette.accent,
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    Create one
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Activity Log Card - Spans full width on desktop */}
                                    <div style={{
                                        ...cardBase,
                                        padding: isMobile ? '16px' : '24px',
                                        gridColumn: isMobile ? '1' : '1 / -1'
                                    }}>
                                        <h2 style={{ fontSize: isMobile ? '16px' : '18px', margin: '0 0 16px 0', color: palette.text, fontWeight: 600 }}>
                                            Recent Activity Log
                                        </h2>
                                        <div style={{
                                            maxHeight: isMobile ? '250px' : '320px',
                                            overflowY: 'auto',
                                            paddingRight: '8px'
                                        }}>
                                            {dashboardLoading ? (
                                                <div style={{ fontSize: '14px', color: palette.textMuted }}>Loading...</div>
                                            ) : dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {dashboardData.recentActivities.map((activity, idx) => (
                                                        <div key={activity.id || idx} style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '12px',
                                                            padding: '12px',
                                                            borderRadius: '8px',
                                                            backgroundColor: 'transparent',
                                                            transition: 'background-color 0.2s ease'
                                                        }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = theme === 'light' ? '#f9fafb' : palette.bgPanel;
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                            }}>
                                                            <div style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                borderRadius: '50%',
                                                                marginTop: '6px',
                                                                flexShrink: 0,
                                                                backgroundColor: activity.isBlocked ? palette.danger : (activity.type === 'vpn' ? palette.accent : palette.textMuted)
                                                            }}></div>
                                                            <div style={{ flex: 1 }}>
                                                                <p style={{ margin: 0, fontSize: '14px', color: palette.text }}>
                                                                    {activity.message || activity.description || 'Activity'}
                                                                </p>
                                                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: palette.textMuted }}>
                                                                    {activity.timestamp || activity.time || activity.timeAgo || 'Just now'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: '14px', color: palette.textMuted, textAlign: 'center', padding: '20px' }}>
                                                    No recent activity
                                                </div>
                                            )}
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
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: isMobile ? '20px' : '30px',
                                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                                    gap: isMobile ? '12px' : '0'
                                }}>
                                    <h1 style={{
                                        fontSize: isMobile ? '18px' : '24px',
                                        margin: 0,
                                        color: palette.text,
                                        fontWeight: 600,
                                        paddingLeft: isMobile ? '48px' : '0',
                                        transition: 'padding-left 0.3s ease',
                                        flex: isMobile ? '1 1 100%' : 'none'
                                    }}>Firewall Rule Management</h1>
                                    <button
                                        onClick={() => {
                                            openFirewallModal();
                                        }}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: palette.accent,
                                            color: theme === 'dark' ? '#121212' : '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}>
                                        + Add New Rule
                                    </button>
                                </div>

                                {/* Rules Table */}
                                <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
                                    {firewallLoading ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: palette.textMuted }}>Loading rules...</div>
                                    ) : firewallRules.length === 0 ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: palette.textMuted }}>No firewall rules yet. Click "+ Add New Rule" to create your first rule.</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: `1px solid ${palette.border}`, backgroundColor: theme === 'light' ? '#f8f9fa' : palette.bgPanel }}>
                                                        <th style={{ padding: '14px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Order</th>
                                                        <th style={{ padding: '14px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Action</th>
                                                        <th style={{ padding: '14px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Source</th>
                                                        <th style={{ padding: '14px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Destination</th>
                                                        <th style={{ padding: '14px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Protocol</th>
                                                        <th style={{ padding: '14px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Port</th>
                                                        <th style={{ padding: '14px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Description</th>
                                                        <th style={{ padding: '14px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, fontSize: '13px' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {firewallRules.map((rule, idx) => (
                                                        <tr key={rule.id} style={{
                                                            borderBottom: idx === firewallRules.length - 1 ? 'none' : `1px solid ${palette.border}`
                                                        }}>
                                                            <td style={{ padding: '14px 12px' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                                                    <button
                                                                        onClick={() => handleMoveRuleUp(rule.id, idx)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: palette.textMuted,
                                                                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                                                            opacity: idx === 0 ? 0.3 : 1,
                                                                            fontSize: '12px',
                                                                            padding: '2px'
                                                                        }}
                                                                        disabled={idx === 0}
                                                                    >
                                                                        ▲
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleMoveRuleDown(rule.id, idx)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: palette.textMuted,
                                                                            cursor: idx === firewallRules.length - 1 ? 'not-allowed' : 'pointer',
                                                                            opacity: idx === firewallRules.length - 1 ? 0.3 : 1,
                                                                            fontSize: '12px',
                                                                            padding: '2px'
                                                                        }}
                                                                        disabled={idx === firewallRules.length - 1}
                                                                    >
                                                                        ▼
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '14px 12px' }}>
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    backgroundColor: rule.action === 'allow'
                                                                        ? (theme === 'dark' ? '#1E402C' : '#e6f4ed')
                                                                        : (theme === 'dark' ? '#40201E' : '#fee2e2'),
                                                                    color: rule.action === 'allow'
                                                                        ? (theme === 'dark' ? '#36E27B' : '#1fa45a')
                                                                        : (theme === 'dark' ? '#FF7777' : '#d4183d'),
                                                                    border: rule.action === 'allow'
                                                                        ? (theme === 'dark' ? '1px solid #36E27B' : '1px solid #1fa45a')
                                                                        : (theme === 'dark' ? '1px solid #FF7777' : '1px solid #d4183d')
                                                                }}>
                                                                    {rule.action === 'allow' ? '✓' : '✗'} {rule.action === 'allow' ? 'Allow' : 'Deny'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '14px 12px', color: palette.text, fontSize: '14px' }}>
                                                                {rule.sourceIP || 'Any'}
                                                            </td>
                                                            <td style={{ padding: '14px 12px', color: palette.text, fontSize: '14px' }}>
                                                                {rule.destinationIP || 'Any'}
                                                            </td>
                                                            <td style={{ padding: '14px 12px' }}>
                                                                <span style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '12px',
                                                                    backgroundColor: theme === 'light' ? '#f1f3f5' : '#2a2a2a',
                                                                    color: palette.textMuted,
                                                                    fontWeight: 500
                                                                }}>
                                                                    {(rule.protocol || 'tcp').toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '14px 12px', color: palette.text, fontSize: '14px' }}>
                                                                {rule.destinationPort || rule.sourcePort || 'Any'}
                                                            </td>
                                                            <td style={{ padding: '14px 12px', color: palette.text, fontSize: '14px' }}>
                                                                {rule.description || '—'}
                                                            </td>
                                                            <td style={{ padding: '14px 12px' }}>
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <button
                                                                        onClick={() => handleResetRule(rule.id)}
                                                                        onMouseEnter={() => setActionButtonHover(`reset-${rule.id}`)}
                                                                        onMouseLeave={() => setActionButtonHover(null)}
                                                                        title="Reset/Refresh"
                                                                        style={{
                                                                            background: actionButtonHover === `reset-${rule.id}`
                                                                                ? (theme === 'dark' ? 'rgba(54,226,123,0.15)' : 'rgba(31,164,90,0.1)')
                                                                                : 'none',
                                                                            border: 'none',
                                                                            color: actionButtonHover === `reset-${rule.id}`
                                                                                ? palette.accent
                                                                                : palette.textMuted,
                                                                            cursor: 'pointer',
                                                                            fontSize: '16px',
                                                                            padding: '4px 6px',
                                                                            borderRadius: '6px',
                                                                            transition: 'all 0.15s ease',
                                                                            transform: actionButtonHover === `reset-${rule.id}` ? 'scale(1.1)' : 'scale(1)'
                                                                        }}
                                                                    >
                                                                        <SlReload />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEditRule(rule)}
                                                                        onMouseEnter={() => setActionButtonHover(`edit-${rule.id}`)}
                                                                        onMouseLeave={() => setActionButtonHover(null)}
                                                                        title="Edit"
                                                                        style={{
                                                                            background: actionButtonHover === `edit-${rule.id}`
                                                                                ? (theme === 'dark' ? 'rgba(54,226,123,0.15)' : 'rgba(31,164,90,0.1)')
                                                                                : 'none',
                                                                            border: 'none',
                                                                            color: actionButtonHover === `edit-${rule.id}`
                                                                                ? palette.accent
                                                                                : palette.textMuted,
                                                                            cursor: 'pointer',
                                                                            fontSize: '16px',
                                                                            padding: '4px 6px',
                                                                            borderRadius: '6px',
                                                                            transition: 'all 0.15s ease',
                                                                            transform: actionButtonHover === `edit-${rule.id}` ? 'scale(1.1)' : 'scale(1)'
                                                                        }}
                                                                    >
                                                                        <MdModeEdit />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteRule(rule.id)}
                                                                        onMouseEnter={() => setActionButtonHover(`delete-${rule.id}`)}
                                                                        onMouseLeave={() => setActionButtonHover(null)}
                                                                        title="Delete"
                                                                        style={{
                                                                            background: actionButtonHover === `delete-${rule.id}`
                                                                                ? (theme === 'dark' ? 'rgba(224,72,72,0.15)' : 'rgba(212,24,61,0.1)')
                                                                                : 'none',
                                                                            border: 'none',
                                                                            color: palette.danger,
                                                                            cursor: 'pointer',
                                                                            fontSize: '16px',
                                                                            padding: '4px 6px',
                                                                            borderRadius: '6px',
                                                                            transition: 'all 0.15s ease',
                                                                            transform: actionButtonHover === `delete-${rule.id}` ? 'scale(1.1)' : 'scale(1)',
                                                                            opacity: actionButtonHover === `delete-${rule.id}` ? 1 : 0.8
                                                                        }}
                                                                    >
                                                                        <RiDeleteBin6Line />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Profiles View */}
                        {currentView === 'profiles' && (
                            <ProfileManager />
                        )}

                        {/* Scanner */}
                        {currentView === 'scan' && <ScanDashboard />}

                        {/* User Management View (Admin Only) */}
                        {currentView === 'users' && user.role === 'admin' && (
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
                                                border: theme === 'light' ? `1px solid ${palette.border}` : `1px solid ${palette.border}`,
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
                                    ) : (() => {
                                        // Filter users based on search query, role, and status
                                        const filteredUsers = users.filter(u => {
                                            // Search filter (by email or ID)
                                            if (!userSearchQuery) {
                                                return true;
                                            }

                                            const searchLower = userSearchQuery.toLowerCase();
                                            const userIndex = users.indexOf(u) + 1;
                                            const userIDString = String(userIndex);

                                            // Check email match (partial match)
                                            const matchesEmail = u.email.toLowerCase().includes(searchLower);

                                            // Check user ID match (exact match only)
                                            const matchesID = userIDString === userSearchQuery;

                                            const matchesSearch = matchesEmail || matchesID;

                                            // Role filter
                                            const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;

                                            // Status filter
                                            const matchesStatus = userStatusFilter === 'all' ||
                                                (userStatusFilter === 'active' && u.isApproved) ||
                                                (userStatusFilter === 'inactive' && !u.isApproved);

                                            return matchesSearch && matchesRole && matchesStatus;
                                        });

                                        return filteredUsers.length === 0 ? (
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
                                                                        {/* placeholder since we don't store last login */}
                                                                        —
                                                                    </td>
                                                                    <td style={{ padding: '12px' }}>
                                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                            {/* Edit - 1st button */}
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
                                                                            {/* Toggle status - 2nd button */}
                                                                            {u.id !== user.id && (
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
                                                                            )}
                                                                            {/* Delete - 3rd button */}
                                                                            {u.id !== user.id && (
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
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Edit User Modal */}
                                {(showEditModal || editModalAnimating) && editingUser && (
                                    <div
                                        onClick={closeEditModal}
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: editModalAnimating ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 1000,
                                            opacity: showEditModal ? 1 : 0,
                                            transition: 'opacity 0.3s ease'
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
                                                transform: showEditModal ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-20px)',
                                                opacity: showEditModal ? 1 : 0,
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative'
                                            }}
                                        >
                                            {/* Close Button */}
                                            <button
                                                onClick={closeEditModal}
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
                                                    disabled={editingUser.id === user.id}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 14px',
                                                        paddingRight: '40px',
                                                        backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
                                                        border: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`,
                                                        borderRadius: '8px',
                                                        color: palette.text,
                                                        fontSize: '14px',
                                                        cursor: editingUser.id === user.id ? 'not-allowed' : 'pointer',
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
                                                        e.target.style.borderColor = palette.accent;
                                                        e.target.style.boxShadow = `0 0 0 3px ${theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.2)'}`;
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
                                                gap: isMobile ? '8px' : '12px',
                                                justifyContent: 'flex-end',
                                                paddingTop: '8px',
                                                borderTop: theme === 'light' ? '1px solid #e5e7eb' : `1px solid ${palette.border}`,
                                                flexDirection: isMobile ? 'column-reverse' : 'row'
                                            }}>
                                                <button
                                                    onClick={closeEditModal}
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
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirm delete dialog for firewall */}
                {confirmDeleteRuleId && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: palette.bgCard,
                            color: palette.text,
                            padding: '24px',
                            borderRadius: '10px',
                            border: `1px solid ${palette.border}`,
                            width: '90%',
                            maxWidth: '420px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.35)'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Delete Firewall Rule</h3>
                            <p style={{ marginTop: 0, marginBottom: '20px', color: palette.textMuted }}>
                                Are you sure you want to delete this rule? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    onClick={() => setConfirmDeleteRuleId(null)}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: palette.bgPanel,
                                        color: palette.text,
                                        border: `1px solid ${palette.border}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteRule}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: palette.danger,
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toasts */}
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 1500
                }}>
                    {toasts.map((t) => (
                        <div key={t.id} style={{
                            minWidth: '260px',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            backgroundColor: t.type === 'error' ? palette.danger : t.type === 'success' ? palette.accent : palette.bgCard,
                            color: t.type === 'error' || t.type === 'success' ? '#fff' : palette.text,
                            border: `1px solid ${palette.border}`,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                        }}>
                            {t.message}
                        </div>
                    ))}
                </div>
            </>
        );
    }

    // Show login/register forms
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

            {/* Toasts */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 1500
            }}>
                {toasts.map((t) => (
                    <div key={t.id} style={{
                        minWidth: '260px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: t.type === 'error' ? palette.danger : t.type === 'success' ? palette.accent : palette.bgCard,
                        color: t.type === 'error' || t.type === 'success' ? '#fff' : palette.text,
                        border: `1px solid ${palette.border}`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}>
                        {t.message}
                    </div>
                ))}
            </div>
        </>
    );
}

export default App;