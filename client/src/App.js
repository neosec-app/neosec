import React, { useState, useEffect } from 'react';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { authAPI } from './services/api';
import './index.css';
import ProfileManager from "./components/ProfileManager";


function App() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
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
      <div className="app-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // If user is logged in, show dashboard
 if (user) {
  return (
    <div className="app-container">
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Welcome to NeoSec</h1>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </header>

        <div className="dashboard-content">
          <div className="user-info">
            <h2>User Information</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Status:</strong> {user.isApproved ? 'Approved' : 'Pending Approval'}</p>
          </div>

          {!user.isApproved && (
            <div className="info-message">
              Your account is pending approval. Please wait for admin approval to access all features.
            </div>
          )}
          {user.isApproved && (
            <div className="profile-manager-section">
              <ProfileManager />
            </div>
          )}
        </div>
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

