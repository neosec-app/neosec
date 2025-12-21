import React, { useState } from 'react';
import SidebarButton from './SidebarButton';

function Sidebar({ user, theme, palette, currentView, setCurrentView, setTheme, isMobile, isTablet, sidebarOpen, setSidebarOpen, handleLogout }) {
    const [navHover, setNavHover] = useState(null);
    const [logoutHover, setLogoutHover] = useState(false);

    return (
        <>
            {/* Hide scrollbar styles */}
            <style>{`
                .sidebar-container::-webkit-scrollbar {
                    width: 0px;
                    background: transparent;
                }
                .sidebar-container {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
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
                position: 'fixed',  // Changed from 'relative' to 'fixed'
                height: '100vh',
                overflowY: isMobile && !sidebarOpen ? 'hidden' : 'auto',
                overflowX: 'hidden',
                zIndex: isMobile ? 1000 : 'auto',
                left: isMobile && !sidebarOpen ? '-260px' : '0',
                top: 0,  // Always start from top
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
                            {/* Clickable Logo */}
                            <button
                                onClick={() => setCurrentView('dashboard')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
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
                            </button>

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

                    <nav className="flex-1 space-y-2 text-sm">
                        {/* HIERARCHY */}
                        <SidebarButton label="Subscription" view="subscription" currentView={currentView} setCurrentView={setCurrentView} theme={theme} palette={palette} />

                        {user.accountType === "leader" && (
                            <SidebarButton label="My Groups" view="groups" currentView={currentView} setCurrentView={setCurrentView} theme={theme} palette={palette} />
                        )}

                        <SidebarButton label="Invitations" view="invitations" currentView={currentView} setCurrentView={setCurrentView} theme={theme} palette={palette} />
                        <SidebarButton label="My Memberships" view="memberships" currentView={currentView} setCurrentView={setCurrentView} theme={theme} palette={palette} />
                    </nav>

                    {user.role === 'admin' && (
                        <>
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
                            <button
                                onMouseEnter={() => setNavHover('scan')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('scan')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'scan' || navHover === 'scan' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'scan' || navHover === 'scan' ? palette.accent : palette.text,
                                    border: currentView === 'scan' || navHover === 'scan' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'scan' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                URL Scanner
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('audit')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('audit')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'audit' || navHover === 'audit' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'audit' || navHover === 'audit' ? palette.accent : palette.text,
                                    border: currentView === 'audit' || navHover === 'audit' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'audit' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Audit Trail
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('system-health')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('system-health')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'system-health' || navHover === 'system-health' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'system-health' || navHover === 'system-health' ? palette.accent : palette.text,
                                    border: currentView === 'system-health' || navHover === 'system-health' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'system-health' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                System Health
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('devices')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('devices')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'devices' || navHover === 'devices' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'devices' || navHover === 'devices' ? palette.accent : palette.text,
                                    border: currentView === 'devices' || navHover === 'devices' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'devices' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Device Inventory
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('mfa')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('mfa')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'mfa' || navHover === 'mfa' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'mfa' || navHover === 'mfa' ? palette.accent : palette.text,
                                    border: currentView === 'mfa' || navHover === 'mfa' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'mfa' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                MFA Settings
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('login-history')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('login-history')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'login-history' || navHover === 'login-history' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'login-history' || navHover === 'login-history' ? palette.accent : palette.text,
                                    border: currentView === 'login-history' || navHover === 'login-history' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'login-history' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Login History
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('feature-toggles')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('feature-toggles')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'feature-toggles' || navHover === 'feature-toggles' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'feature-toggles' || navHover === 'feature-toggles' ? palette.accent : palette.text,
                                    border: currentView === 'feature-toggles' || navHover === 'feature-toggles' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'feature-toggles' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Feature Toggles
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('role-templates')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('role-templates')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'role-templates' || navHover === 'role-templates' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'role-templates' || navHover === 'role-templates' ? palette.accent : palette.text,
                                    border: currentView === 'role-templates' || navHover === 'role-templates' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'role-templates' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Role Templates
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('impersonation')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('impersonation')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'impersonation' || navHover === 'impersonation' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'impersonation' || navHover === 'impersonation' ? palette.accent : palette.text,
                                    border: currentView === 'impersonation' || navHover === 'impersonation' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'impersonation' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                User Impersonation
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('admin-notifications')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('admin-notifications')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'admin-notifications' || navHover === 'admin-notifications' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'admin-notifications' || navHover === 'admin-notifications' ? palette.accent : palette.text,
                                    border: currentView === 'admin-notifications' || navHover === 'admin-notifications' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'admin-notifications' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Admin Notifications
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('threat-blocker')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('threat-blocker')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'threat-blocker' || navHover === 'threat-blocker' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'threat-blocker' || navHover === 'threat-blocker' ? palette.accent : palette.text,
                                    border: currentView === 'threat-blocker' || navHover === 'threat-blocker' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'threat-blocker' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Threat Blocker
                            </button>
                            <button
                                onMouseEnter={() => setNavHover('activity-logs')}
                                onMouseLeave={() => setNavHover(null)}
                                onClick={() => setCurrentView('activity-logs')}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: currentView === 'activity-logs' || navHover === 'activity-logs' ? palette.accentSoft : 'transparent',
                                    color: currentView === 'activity-logs' || navHover === 'activity-logs' ? palette.accent : palette.text,
                                    border: currentView === 'activity-logs' || navHover === 'activity-logs' ? `1px solid ${palette.accent}` : '1px solid transparent',
                                    borderRadius: '10px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: navHover === 'activity-logs' ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Activity Logs
                            </button>
                        </>
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
        </>
    );
}

export default Sidebar;

