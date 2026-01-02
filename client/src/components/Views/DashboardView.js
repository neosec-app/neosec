import React, { useState } from 'react';
import { SiAlwaysdata } from 'react-icons/si';
import { GoAlertFill } from 'react-icons/go';
import { FiUsers } from 'react-icons/fi';
import { getCardBaseStyle } from '../../utils/styles';
import { vpnAPI, dashboardAPI, getErrorMessage } from '../../services/api';

function DashboardView({ user, theme, palette, dashboardData, dashboardLoading, dashboardError, isMobile, isTablet, setCurrentView, onDashboardRefresh }) {
    const cardBase = getCardBaseStyle(palette, theme);
    const [disconnecting, setDisconnecting] = useState(false);

    return (
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

            {/* Dashboard Error Message */}
            {dashboardError && !dashboardLoading && (
                <div style={{
                    ...cardBase,
                    padding: '16px',
                    marginBottom: '24px',
                    backgroundColor: palette.danger + '20',
                    border: `1px solid ${palette.danger}`,
                }}>
                    <strong style={{ color: palette.danger }}>Error loading dashboard:</strong>
                    <p style={{ margin: '8px 0 0 0', color: palette.danger }}>
                        {dashboardError}
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
                                        cursor: disconnecting ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                        opacity: disconnecting ? 0.6 : 1
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = theme === 'light' ? '#f3f4f6' : palette.bgPanel;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                    }}
                                    onClick={async () => {
                                        const configId = dashboardData?.vpnStatus?.configId;
                                        if (!configId) {
                                            console.error('VPN config ID not found');
                                            return;
                                        }

                                        try {
                                            setDisconnecting(true);
                                            const response = await vpnAPI.toggleVpnConfig(configId);
                                            if (response.success) {
                                                // Refresh dashboard data after disconnecting
                                                if (onDashboardRefresh) {
                                                    await onDashboardRefresh();
                                                } else {
                                                    // Fallback: manually refresh dashboard
                                                    const dashboardResponse = await dashboardAPI.getDashboard();
                                                    if (dashboardResponse.success) {
                                                        // Force page reload if refresh callback not available
                                                        window.location.reload();
                                                    }
                                                }
                                            } else {
                                                console.error('Failed to disconnect VPN:', response.message);
                                                alert(response.message || 'Failed to disconnect VPN');
                                            }
                                        } catch (error) {
                                            console.error('Error disconnecting VPN:', error);
                                            alert(getErrorMessage(error, 'Failed to disconnect VPN'));
                                        } finally {
                                            setDisconnecting(false);
                                        }
                                    }}
                                    disabled={disconnecting}
                                >
                                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
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

                {/* Active Users Card - 3rd column, same row as Active Profile */}
                <div style={{ ...cardBase, padding: isMobile ? '16px' : '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobile ? '16px' : '20px' }}>
                        <FiUsers style={{ fontSize: isMobile ? '18px' : '20px', color: palette.accent }} />
                        <h2 style={{ fontSize: isMobile ? '16px' : '18px', margin: 0, color: palette.text, fontWeight: 600 }}>
                            {user?.role === 'admin' ? 'Active Users' : 'Group Members'}
                        </h2>
                    </div>
                    {dashboardLoading ? (
                        <div style={{ fontSize: '14px', color: palette.textMuted }}>Loading...</div>
                    ) : dashboardData?.activeUsers && dashboardData.activeUsers.length > 0 ? (
                        <div style={{
                            maxHeight: isMobile ? '200px' : '280px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            paddingRight: '8px',
                            // Custom scrollbar styling for Firefox
                            scrollbarWidth: 'thin',
                            scrollbarColor: `${palette.border} transparent`
                        }}
                        className="active-users-scroll"
                        >
                            <style>{`
                                .active-users-scroll::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .active-users-scroll::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                                .active-users-scroll::-webkit-scrollbar-thumb {
                                    background: ${palette.border};
                                    border-radius: 3px;
                                }
                                .active-users-scroll::-webkit-scrollbar-thumb:hover {
                                    background: ${palette.textMuted};
                                }
                            `}</style>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {dashboardData.activeUsers.map((activeUser) => (
                                    <div
                                        key={activeUser.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            backgroundColor: 'transparent',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = theme === 'light' ? '#f9fafb' : palette.bgPanel;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        <div style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            backgroundColor: activeUser.isActive ? '#10b981' : '#f59e0b',
                                            flexShrink: 0,
                                            boxShadow: activeUser.isActive 
                                                ? `0 0 6px #10b981` 
                                                : `0 0 6px #f59e0b`
                                        }}></div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    color: palette.text,
                                                    fontWeight: 500,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    flex: 1
                                                }}>
                                                    {activeUser.email}
                                                </p>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '11px',
                                                    color: activeUser.isActive ? '#10b981' : '#f59e0b',
                                                    fontWeight: 500,
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {activeUser.statusText || 'now'}
                                                </p>
                                            </div>
                                            {activeUser.role === 'admin' && (
                                                <p style={{
                                                    margin: '2px 0 0 0',
                                                    fontSize: '11px',
                                                    color: palette.textMuted
                                                }}>
                                                    Admin
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '14px', color: palette.textMuted, textAlign: 'center', padding: '20px' }}>
                            {user?.role === 'admin' 
                                ? 'No active users' 
                                : 'No active group members'}
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
    );
}

export default DashboardView;

