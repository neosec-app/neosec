import React, { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { authAPI, dashboardAPI, adminAPI } from './services/api';
import './index.css';

// Hierarchy Components
import Subscription from './components/Hierarchy/Subscription';
import GroupManagement from './components/Hierarchy/GroupManagement';
import Invitations from './components/Hierarchy/Invitations';
import Memberships from './components/Hierarchy/Memberships';

function App() {
    const [activeTab, setActiveTab] = useState('login');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [currentView, setCurrentView] = useState('dashboard');
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    // Admin state
    const [users, setUsers] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);

    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // ---------------- AUTH CHECK ----------------
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

    // -------- DASHBOARD DATA FETCH --------------
    useEffect(() => {
        const fetchDashboard = async () => {
            if (user && currentView === 'dashboard') {
                try {
                    setDashboardLoading(true);
                    const res = await dashboardAPI.getDashboard();
                    if (res.success) setDashboardData(res.data);
                } catch (err) {
                    console.error('Dashboard fetch error:', err);
                } finally {
                    setDashboardLoading(false);
                }
            }
        };
        fetchDashboard();
    }, [user, currentView]);

    // -------- ADMIN DATA FETCH (USERS + STATS) --
    useEffect(() => {
        const fetchAdminData = async () => {
            if (user && user.role === 'admin' && currentView === 'users') {
                try {
                    setUsersLoading(true);
                    const [usersRes, statsRes] = await Promise.all([
                        adminAPI.getAllUsers(),
                        adminAPI.getStatistics()
                    ]);
                    if (usersRes.success) setUsers(usersRes.data || []);
                    if (statsRes.success) setAdminStats(statsRes.data);
                } catch (err) {
                    console.error('Admin fetch error:', err);
                } finally {
                    setUsersLoading(false);
                }
            }
        };
        fetchAdminData();
    }, [user, currentView]);

    const handleEditUser = (u) => {
        setEditingUser({ ...u });
        setShowEditModal(true);
    };

    const handleSaveUser = async () => {
        try {
            const res = await adminAPI.updateUser(editingUser.id, {
                email: editingUser.email,
                role: editingUser.role,
                isApproved: editingUser.isApproved
            });
            if (res.success) {
                setUsers(users.map(u => (u.id === editingUser.id ? res.data : u)));
                setShowEditModal(false);
                setEditingUser(null);
            }
        } catch (err) {
            console.error('Update user error:', err);
            alert('Failed to update user: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await adminAPI.deleteUser(id);
            if (res.success) setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            console.error('Delete user error:', err);
            alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
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

    // ---------------- LOADING -------------------
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#121212] text-primary text-lg">
                Loading...
            </div>
        );
    }

    // --------------- AUTHENTICATED UI -----------
    if (user) {
        return (
            <div className="min-h-screen flex bg-[#121212] text-white">
                {/* SIDEBAR */}
                <aside className="w-64 bg-[#181818] border-r border-[#282828] p-5 flex flex-col">
                    <div className="pb-5 mb-5 border-b border-[#282828]">
                        <h2 className="text-2xl font-semibold text-primary">NeoSec</h2>
                        <p className="text-xs text-[#888] mt-1">{user.email}</p>
                        <span
                            className={`inline-flex mt-3 px-3 py-1 rounded-full text-xs border ${
                                user.role === 'admin'
                                    ? 'bg-[#1E402C] text-primary border-primary'
                                    : 'bg-[#282828] text-white border-[#444]'
                            }`}
                        >
              {user.role === 'admin' ? 'Admin' : 'User'}
            </span>
                    </div>

                    <nav className="flex-1 space-y-2 text-sm">
                        <SidebarButton
                            label="Dashboard"
                            view="dashboard"
                            currentView={currentView}
                            setCurrentView={setCurrentView}
                        />
                        <SidebarButton
                            label="VPN Configurations"
                            view="vpn"
                            currentView={currentView}
                            setCurrentView={setCurrentView}
                        />
                        <SidebarButton
                            label="Firewall Rules"
                            view="firewall"
                            currentView={currentView}
                            setCurrentView={setCurrentView}
                        />
                        <SidebarButton
                            label="Security Profiles"
                            view="profiles"
                            currentView={currentView}
                            setCurrentView={setCurrentView}
                        />

                        {user.role === 'admin' && (
                            <SidebarButton
                                label="User Management"
                                view="users"
                                currentView={currentView}
                                setCurrentView={setCurrentView}
                            />
                        )}

                        {/* Hierarchy buttons */}
                        <SidebarButton
                            label="👑 Subscription"
                            view="subscription"
                            currentView={currentView}
                            setCurrentView={setCurrentView}
                        />

                        {user.accountType === 'leader' && (
                            <SidebarButton
                                label="👥 My Groups"
                                view="groups"
                                currentView={currentView}
                                setCurrentView={setCurrentView}
                            />
                        )}

                        <SidebarButton
                            label="📬 Invitations"
                            view="invitations"
                            currentView={currentView}
                            setCurrentView={setCurrentView}
                        />

                        <SidebarButton
                            label="🎫 My Memberships"
                            view="memberships"
                            currentView={currentView}
                            setCurrentView={setCurrentView}
                        />
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="mt-4 w-full py-3 text-sm rounded-lg border border-[#444] bg-[#282828] hover:bg-[#333] transition"
                    >
                        Logout
                    </button>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-10 overflow-y-auto space-y-8">
                    {currentView === 'dashboard' && (
                        <DashboardPanel
                            user={user}
                            dashboardData={dashboardData}
                            dashboardLoading={dashboardLoading}
                        />
                    )}

                    {currentView === 'vpn' && (
                        <EmptyPanel title="VPN Configurations" buttonLabel="+ Add VPN Config" />
                    )}

                    {currentView === 'firewall' && (
                        <EmptyPanel title="Firewall Rules" buttonLabel="+ Add Rule" />
                    )}

                    {currentView === 'profiles' && (
                        <EmptyPanel title="Security Profiles" buttonLabel="+ Create Profile" />
                    )}

                    {currentView === 'users' && user.role === 'admin' && (
                        <UserManagementPanel
                            users={users}
                            usersLoading={usersLoading}
                            adminStats={adminStats}
                            editingUser={editingUser}
                            setEditingUser={setEditingUser}
                            showEditModal={showEditModal}
                            setShowEditModal={setShowEditModal}
                            handleEditUser={handleEditUser}
                            handleSaveUser={handleSaveUser}
                            handleDeleteUser={handleDeleteUser}
                            user={user}
                        />
                    )}

                    {currentView === 'subscription' && (
                        <Subscription
                            user={user}
                            onUpgradeSuccess={(updatedUser) => {
                                setUser(updatedUser);
                                const token = localStorage.getItem('token');
                                if (token) {
                                    localStorage.setItem('user', JSON.stringify(updatedUser));
                                }
                            }}
                        />
                    )}

                    {currentView === 'groups' && user.accountType === 'leader' && (
                        <GroupManagement user={user} />
                    )}

                    {currentView === 'invitations' && <Invitations />}

                    {currentView === 'memberships' && <Memberships />}
                </main>
            </div>
        );
    }

    // --------------- LOGIN / REGISTER -----------
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

/* ============== SMALL HELPER COMPONENTS ================= */

function SidebarButton({ label, view, currentView, setCurrentView }) {
    const active = currentView === view;
    return (
        <button
            onClick={() => setCurrentView(view)}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition border 
        ${active
                ? 'bg-[#1E402C] border-primary text-primary'
                : 'bg-transparent border-transparent text-white hover:bg-[#222222]'}`}
        >
            {label}
        </button>
    );
}

function EmptyPanel({ title, buttonLabel }) {
    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-semibold">{title}</h1>
                <button className="btn-primary">{buttonLabel}</button>
            </div>
            <div className="card text-center text-[#B3B3B3]">
                <p>No data available yet.</p>
            </div>
        </section>
    );
}

function DashboardPanel({ user, dashboardData, dashboardLoading }) {
    return (
        <section>
            <h1 className="text-3xl font-semibold mb-1">Welcome to NeoSec</h1>
            <p className="text-sm text-[#B3B3B3] mb-6">
                VPN &amp; Firewall Manager Dashboard
            </p>

            {!user.isApproved && (
                <div className="card border border-amber-500 bg-[#282828] mb-6">
                    <p className="text-amber-400 font-semibold flex items-center gap-2">
                        ⚠️ Account Pending Approval
                    </p>
                    <p className="text-sm text-[#ddd] mt-2">
                        Your account is awaiting admin approval. Some features may be restricted.
                    </p>
                </div>
            )}

            {/* Stats cards */}
            <div className="grid gap-5 mb-6 md:grid-cols-3">
                <div className="card">
                    <p className="card-title">VPN Status</p>
                    {dashboardLoading ? (
                        <p className="small-text">Loading...</p>
                    ) : (
                        <>
                            <p
                                className={`card-value ${
                                    dashboardData?.vpnStatus?.connected ? 'text-primary' : 'text-amber-400'
                                }`}
                            >
                                {dashboardData?.vpnStatus?.connected ? 'Connected' : 'Disconnected'}
                            </p>
                            <p className="small-text mt-2">
                                {dashboardData?.vpnStatus?.server
                                    ? `Server: ${dashboardData.vpnStatus.server}`
                                    : 'No active connection'}
                            </p>
                        </>
                    )}
                </div>

                <div className="card">
                    <p className="card-title">Threats Blocked</p>
                    {dashboardLoading ? (
                        <p className="small-text">Loading...</p>
                    ) : (
                        <>
                            <p className="card-value">
                                {dashboardData?.threatsBlocked?.last24Hours || 0}
                            </p>
                            <p className="small-text mt-2">
                                Last 24 hours (Total: {dashboardData?.threatsBlocked?.total || 0})
                            </p>
                        </>
                    )}
                </div>

                <div className="card">
                    <p className="card-title">Active Rules</p>
                    <p className="card-value">12</p>
                    <p className="small-text mt-2">Firewall rules active</p>
                </div>
            </div>

            {/* Account info */}
            <div className="card">
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                <div className="space-y-2 text-sm">
                    <p>
                        <span className="text-[#B3B3B3]">Email: </span>
                        <span>{user.email}</span>
                    </p>
                    <p>
                        <span className="text-[#B3B3B3]">Role: </span>
                        <span
                            className={user.role === 'admin' ? 'text-primary font-semibold' : ''}
                        >
              {user.role}
            </span>
                    </p>
                    <p>
                        <span className="text-[#B3B3B3]">Status: </span>
                        <span className={user.isApproved ? 'text-primary' : 'text-amber-400'}>
              {user.isApproved ? '✅ Approved' : '⏳ Pending'}
            </span>
                    </p>
                </div>
            </div>
        </section>
    );
}

function UserManagementPanel({
                                 users,
                                 usersLoading,
                                 adminStats,
                                 editingUser,
                                 setEditingUser,
                                 showEditModal,
                                 setShowEditModal,
                                 handleEditUser,
                                 handleSaveUser,
                                 handleDeleteUser,
                                 user
                             }) {
    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-semibold">User Management</h1>
            </div>

            {adminStats && (
                <div className="grid gap-4 mb-6 md:grid-cols-4">
                    <div className="card">
                        <p className="card-title">Total Users</p>
                        <p className="card-value">{adminStats.users?.total || 0}</p>
                    </div>
                    <div className="card">
                        <p className="card-title">Pending Approvals</p>
                        <p className="card-value text-amber-400">
                            {adminStats.users?.pendingApprovals || 0}
                        </p>
                    </div>
                    <div className="card">
                        <p className="card-title">Total Threats Blocked</p>
                        <p className="card-value">{adminStats.threats?.totalBlocked || 0}</p>
                    </div>
                    <div className="card">
                        <p className="card-title">Application Health</p>
                        <p className="card-value">
                            {adminStats.applicationHealth?.status || 'Unknown'}
                        </p>
                    </div>
                </div>
            )}

            <div className="card">
                <h2 className="text-lg font-semibold mb-4">All Users</h2>
                {usersLoading ? (
                    <p className="text-center text-[#B3B3B3] py-6">Loading users...</p>
                ) : users.length === 0 ? (
                    <p className="text-center text-[#B3B3B3] py-6">No users found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-[#282828] text-[#B3B3B3]">
                                <th className="px-3 py-2 text-left">Email</th>
                                <th className="px-3 py-2 text-left">Role</th>
                                <th className="px-3 py-2 text-left">Status</th>
                                <th className="px-3 py-2 text-left">Created</th>
                                <th className="px-3 py-2 text-left">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-[#282828]">
                                    <td className="px-3 py-2">{u.email}</td>
                                    <td className="px-3 py-2">
                      <span
                          className={`inline-flex px-3 py-1 rounded-full border text-xs ${
                              u.role === 'admin'
                                  ? 'bg-[#1E402C] text-primary border-primary'
                                  : 'bg-[#282828] text-white border-[#444]'
                          }`}
                      >
                        {u.role}
                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                      <span
                          className={
                              u.isApproved ? 'text-primary' : 'text-amber-400'
                          }
                      >
                        {u.isApproved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-[#B3B3B3]">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 space-x-2">
                                        <button
                                            onClick={() => handleEditUser(u)}
                                            className="btn-primary !py-1 !px-3 text-xs"
                                        >
                                            Edit
                                        </button>
                                        {u.id !== user.id && (
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="btn-danger !py-1 !px-3 text-xs"
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

            {showEditModal && editingUser && (
                <EditUserModal
                    editingUser={editingUser}
                    setEditingUser={setEditingUser}
                    setShowEditModal={setShowEditModal}
                    handleSaveUser={handleSaveUser}
                    currentUser={user}
                />
            )}
        </section>
    );
}

function EditUserModal({
                           editingUser,
                           setEditingUser,
                           setShowEditModal,
                           handleSaveUser,
                           currentUser
                       }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="card w-full max-w-lg">
                <h2 className="text-xl font-semibold mb-4">Edit User</h2>

                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block text-[#B3B3B3] mb-1">Email</label>
                        <input
                            type="email"
                            value={editingUser.email}
                            onChange={(e) =>
                                setEditingUser({ ...editingUser, email: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-[#121212] border border-[#282828] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-[#B3B3B3] mb-1">Role</label>
                        <select
                            value={editingUser.role}
                            onChange={(e) =>
                                setEditingUser({ ...editingUser, role: e.target.value })
                            }
                            disabled={editingUser.id === currentUser.id}
                            className="w-full px-3 py-2 bg-[#121212] border border-[#282828] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="approved"
                            type="checkbox"
                            checked={editingUser.isApproved}
                            onChange={(e) =>
                                setEditingUser({ ...editingUser, isApproved: e.target.checked })
                            }
                            className="w-4 h-4 accent-primary"
                        />
                        <label htmlFor="approved" className="text-[#B3B3B3]">
                            Approved
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 text-sm">
                    <button
                        onClick={() => {
                            setShowEditModal(false);
                            setEditingUser(null);
                        }}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button onClick={handleSaveUser} className="btn-primary">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
