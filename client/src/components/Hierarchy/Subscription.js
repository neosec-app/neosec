// src/components/Hierarchy/Subscription.js
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [processingTier, setProcessingTier] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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
      setMessage('🎉 Congratulations! Payment successful!');

      // Refresh user data to check if they became a leader
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Checking user status...');
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('User data after payment:', userData);

          if (userData.user?.accountType === 'leader') {
            console.log('User is already a leader');
            setMessage('🎉 Congratulations! You are now a Leader! You can create and manage groups.');
            setTimeout(() => {
              alert('🎉 Welcome to Leader status! You can now access group management features.');
            }, 1000);
          } else {
            console.log('User not upgraded yet, attempting manual upgrade...');
            // Fallback: try to manually upgrade user if webhook didn't process
            await manuallyUpgradeUser();
          }
        } else {
          console.log('Failed to fetch user data, trying manual upgrade...');
          await manuallyUpgradeUser();
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

  const manuallyUpgradeUser = async () => {
    try {
      // This is a fallback for test mode when webhook doesn't fire
      const response = await api.post('/subscription/upgrade-test');
      if (response.data.success) {
        setMessage('🎉 Congratulations! You are now a Leader! You can create and manage groups.');
        setTimeout(() => {
          alert('🎉 Welcome to Leader status! You can now access group management features.');
        }, 1000);
        // Refresh data
        await fetchData();
      }
    } catch (error) {
      console.error('Manual upgrade failed:', error);
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
      console.log('Fetching subscription data...');
      const subData = await api.get('/subscription/me');
      console.log('Raw subscription response:', subData);
      console.log('Subscription data:', subData?.subscription);
      console.log('Subscription tier:', subData?.subscription?.tier);
      setCurrentPlan(subData?.subscription?.tier || 'free');
      console.log('Setting current plan to:', subData?.subscription?.tier || 'free');

      // Fetch billing history
      const billData = await api.get('/subscription/billing');
      console.log('Billing data:', billData);
      setBillingHistory(billData.history || []);

    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load subscription data';
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