// src/components/Hierarchy/Subscription.js
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const darkPalette = {
  bgMain: '#121212',
  bgCard: '#181818',
  bgPanel: '#0a0a0a',
  text: '#ffffff',
  textMuted: '#9aa3b5',
  border: '#242424',
  accent: '#36E27B',
  accentSoft: 'rgba(54,226,123,0.12)',
  danger: '#e04848',
};

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    period: '/ month',
    features: [
      'Up to 5 profiles',
      '1 group',
      '10 members',
      'Standard firewall rules',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29.99',
    period: '/ month',
    popular: true,
    features: [
      'Up to 20 profiles',
      '5 groups',
      '50 members',
      'Advanced firewall rules',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49.99',
    period: '/ month',
    features: [
      'Unlimited profiles',
      'Unlimited groups',
      'Unlimited members',
      'Advanced security policies',
      '24/7 premium support',
    ],
  },
];

const Subscription = () => {
  const colors = darkPalette;

  const [currentPlan, setCurrentPlan] = useState('free');
  const [billingHistory, setBillingHistory] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingTier, setProcessingTier] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [selectedTier, setSelectedTier] = useState(() => {
    // Load from localStorage if available
    return localStorage.getItem('selectedTier') || 'basic';
  });


  useEffect(() => {
    fetchData();
    checkURLParams();
  }, []);


  const checkURLParams = () => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success')) {
      // Show congratulations and refresh data to check leader status
      handlePaymentSuccess();
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('canceled')) {
      setMessage('Payment was canceled.');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      console.log('=== PAYMENT SUCCESS HANDLING ===');
      console.log('Current selectedTier state:', selectedTier);
      setMessage('🎉 Congratulations! Payment successful!');

      // First, try manual upgrade (this creates subscription and billing history)
      console.log('Attempting manual upgrade for tier:', selectedTier);
      await manuallyUpgradeUser(selectedTier);

      // Refresh user data to check if they became a leader
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Refreshing user data...');
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('Updated user data:', userData);

          // Update localStorage with fresh user data
          localStorage.setItem('user', JSON.stringify(userData.user));

          if (userData.user?.accountType === 'leader') {
            console.log('User is now a leader!');
            setMessage('🎉 Congratulations! You are now a Leader! You can create and manage groups.');
            setTimeout(() => {
              alert('🎉 Welcome to Leader status! You can now access group management features.');
              // Refresh the page to ensure all components get updated user data
              window.location.reload();
            }, 1000);
          } else {
            console.log('User still not a leader after upgrade - this is unexpected');
            setMessage('🎉 Payment successful! Your leader status is being processed.');
          }
        } else {
          console.log('Failed to refresh user data');
        }
      }

      // Refresh subscription data
      console.log('Refreshing subscription data...');
      await fetchData();

    } catch (error) {
      console.error('Error in payment success handling:', error);
      setMessage('🎉 Payment successful! Please refresh the page to see your leader status.');
    }
  };

  const manuallyUpgradeUser = async (selectedTier = 'basic') => {
    try {
      console.log('=== CALLING MANUAL UPGRADE ===');
      console.log('Selected tier:', selectedTier);
      // This is a fallback for test mode when webhook doesn't fire
      console.log('Making API call to /subscription/upgrade-test with tier:', selectedTier);
      const response = await api.post('/subscription/upgrade-test', { tier: selectedTier });
      console.log('Manual upgrade response:', response);
      console.log('Response data:', response.data);

      if (response.data.success) {
        console.log('Manual upgrade successful');
        setMessage(`🎉 Congratulations! You are now a Leader with ${selectedTier.toUpperCase()} plan! You can create and manage groups.`);
        setTimeout(() => {
          alert(`🎉 Welcome to Leader status with ${selectedTier.toUpperCase()} plan! You can now access group management features.`);
        }, 1000);

        // Clear the stored tier after successful upgrade
        localStorage.removeItem('selectedTier');

        // Refresh data
        console.log('Refreshing data after manual upgrade...');
        await fetchData();
      } else {
        console.log('Manual upgrade response not successful:', response.data);
      }
    } catch (error) {
      console.error('Manual upgrade failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMessage('🎉 Payment successful! Your leader status may take a moment to update. Please refresh the page.');
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch subscription
      const subData = await api.get('/subscription/me');
      const newPlan = subData?.data?.subscription?.tier || 'free';
      setCurrentPlan(newPlan);

      // Fetch billing history
      const billData = await api.get('/subscription/billing');
      setBillingHistory(billData?.data?.history || []);

      // Fetch user's group memberships
      try {
        const membershipsResponse = await hierarchyAPI.getMyMemberships();
        if (membershipsResponse.success) {
          setMemberships(membershipsResponse.memberships || []);
        }
      } catch (membershipsError) {
        console.error('Fetch memberships error:', membershipsError);
      }

    } catch (err) {
      console.error('Failed to load subscription data:', err?.response?.data?.message || err?.message);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load subscription data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async (tier) => {
    console.log('startCheckout called with tier:', tier);

    if (!tier || !['basic', 'pro', 'enterprise'].includes(tier)) {
      console.error('Invalid tier:', tier);
      alert('Invalid subscription tier selected');
      return;
    }

    setSelectedTier(tier); // Store the selected tier
    localStorage.setItem('selectedTier', tier); // Persist across page reloads
    console.log('Set selectedTier to:', tier);
    setProcessingTier(tier);
    setError(null);

    try {
      console.log('Starting checkout for tier:', tier);
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      if (!token) {
        throw new Error('No authentication token found. Please log in first.');
      }

      console.log('Making API call to subscription endpoint...');
      const response = await api.post('/subscription/create-checkout-session', { tier });
      console.log('Raw API response:', response);
      console.log('API response data:', response?.data);

      const data = response?.data;
      if (!data) {
        throw new Error('No response data received from server');
      }

      if (data.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        console.error('No URL in response:', data);
        throw new Error('No checkout URL returned from server');
      }
    } catch (err) {
      console.error('Checkout error occurred');
      console.error('Error type:', typeof err);
      console.error('Error object:', err);

      // More defensive error handling
      let errorMessage = 'Failed to create checkout session';
      try {
        if (err && typeof err === 'object') {
          errorMessage = err.response?.data?.message || err.message || errorMessage;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
      } catch (parseError) {
        console.error('Error parsing error message:', parseError);
        errorMessage = 'An unexpected error occurred';
      }

      console.error('Final error message:', errorMessage);
      setError(errorMessage);
      alert(errorMessage);
      setProcessingTier(null);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: 32, 
        maxWidth: 1200, 
        color: colors.text,
        minHeight: '100vh'
      }}>
        <h2 style={{ fontSize: 30 }}>Loading subscription...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 32, 
      maxWidth: 1200, 
      margin: '0 auto',
      color: colors.text,
      minHeight: '100vh'
    }}>
      <h2 style={{ fontSize: 30, marginBottom: 8 }}>Subscription & Billing</h2>
      <p style={{ color: colors.textMuted, marginBottom: 24 }}>
        Manage your plan and billing
      </p>

      {/* Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(224, 72, 72, 0.12)',
            border: `1px solid ${colors.danger}`,
            padding: 14,
            borderRadius: 8,
            marginBottom: 24,
            color: colors.danger,
          }}
        >
          {error}
        </div>
      )}

      {/* Success/Cancel Message */}
      {message && (
        <div
          style={{
            backgroundColor: colors.accentSoft,
            border: `1px solid ${colors.accent}`,
            padding: 14,
            borderRadius: 8,
            marginBottom: 24,
            color: colors.accent,
          }}
        >
          {message}
        </div>
      )}


      {/* Current Plan Card */}
      <div
        style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
        }}
      >
        {console.log('=== RENDERING CURRENT PLAN ===', currentPlan)}
        <h3 style={{ margin: 0, fontSize: 18, marginBottom: 8 }}>
          Current Plan:{' '}
          <span style={{ color: colors.accent, fontSize: 22, fontWeight: 700 }}>
            {currentPlan.toUpperCase()}
          </span>
        </h3>
        <p style={{ color: colors.textMuted, margin: 0 }}>
          {currentPlan === 'free' 
            ? 'Upgrade to unlock more features' 
            : 'Thank you for being a premium member'}
        </p>
      </div>

      {/* Plans Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 40,
        }}
      >
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isProcessing = processingTier === plan.id;

          return (
            <div
              key={plan.id}
              style={{
                backgroundColor: colors.bgCard,
                border: `2px solid ${
                  isCurrent ? colors.accent : plan.popular ? colors.accent + '80' : colors.border
                }`,
                borderRadius: 14,
                padding: 24,
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 20,
                    backgroundColor: colors.accent,
                    color: '#121212',
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  POPULAR
                </div>
              )}

              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 22 }}>{plan.name}</h3>
              
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: colors.accent }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 16, color: colors.textMuted, marginLeft: 4 }}>
                  {plan.period}
                </span>
              </div>

              <ul style={{ 
                paddingLeft: 0, 
                listStyle: 'none',
                margin: '0 0 20px 0'
              }}>
                {plan.features.map((f, i) => (
                  <li 
                    key={i} 
                    style={{ 
                      color: colors.textMuted,
                      marginBottom: 12,
                      paddingLeft: 24,
                      position: 'relative'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: colors.accent
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent || isProcessing}
                onClick={() => startCheckout(plan.id)}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: isCurrent 
                    ? colors.border 
                    : isProcessing 
                      ? colors.textMuted
                      : colors.accent,
                  color: isCurrent ? colors.textMuted : '#121212',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: isCurrent || isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isCurrent || isProcessing ? 0.6 : 1,
                }}
              >
                {isCurrent 
                  ? 'Current Plan' 
                  : isProcessing 
                    ? 'Processing...' 
                    : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* My Groups */}
      <div
        style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 20, fontSize: 20 }}>My Groups</h3>
        {memberships.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>👥</div>
            <p style={{ color: colors.textMuted, margin: 0 }}>You're not a member of any groups yet.</p>
            <p style={{ color: colors.textMuted, margin: '8px 0 0 0', fontSize: '14px' }}>
              Ask a group leader to invite you, or upgrade to become a leader yourself!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {memberships.map((membership) => (
              <div
                key={membership.id}
                style={{
                  padding: '16px',
                  backgroundColor: colors.bgMain,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: colors.text }}>
                    {membership.group?.name || 'Unknown Group'}
                  </h4>
                  <span style={{
                    padding: '2px 6px',
                    backgroundColor: colors.accentSoft,
                    color: colors.accent,
                    fontSize: '11px',
                    fontWeight: '600',
                    borderRadius: '4px',
                  }}>
                    Member
                  </span>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '14px', marginBottom: '8px' }}>
                  {membership.group?.description || 'No description'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                    Role: <span style={{ color: colors.text, fontWeight: '600' }}>
                      {membership.role || 'Member'}
                    </span>
                  </span>
                  <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                    Joined: {new Date(membership.joinedAt || membership.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing History */}
      <div
        style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 20, fontSize: 20 }}>Billing History</h3>
        {billingHistory.length === 0 ? (
          <p style={{ color: colors.textMuted, margin: 0 }}>No invoices yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.textMuted, fontWeight: 600 }}>Plan</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.textMuted, fontWeight: 600 }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.textMuted, fontWeight: 600 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', color: colors.textMuted, fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((bill) => (
                  <tr key={bill.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px 8px', color: colors.text }}>{bill.plan}</td>
                    <td style={{ padding: '12px 8px', color: colors.text }}>{bill.amount}</td>
                    <td style={{ padding: '12px 8px', color: colors.text }}>
                      {new Date(bill.paidAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 8px', color: colors.accent, fontWeight: 600 }}>
                      {bill.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;