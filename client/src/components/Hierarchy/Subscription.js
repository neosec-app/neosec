// src/components/Hierarchy/Subscription.js
import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../services/api';

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
      setMessage('Payment successful! Your subscription will be updated shortly.');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('canceled')) {
      setMessage('Payment was canceled.');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
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
      const subRes = await fetch(`${API_BASE}/subscription/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!subRes.ok) {
        throw new Error(`Failed to fetch subscription: ${subRes.status}`);
      }

      const subData = await subRes.json();
      console.log('Subscription data:', subData);
      setCurrentPlan(subData.subscription?.tier || 'free');

      // Fetch billing history
      const billRes = await fetch(`${API_BASE}/subscription/billing`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!billRes.ok) {
        throw new Error(`Failed to fetch billing: ${billRes.status}`);
      }

      const billData = await billRes.json();
      console.log('Billing data:', billData);
      setBillingHistory(billData.history || []);

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async (tier) => {
    setProcessingTier(tier);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${API_BASE}/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
      alert(err.message);
    } finally {
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