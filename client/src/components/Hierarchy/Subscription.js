// src/components/Hierarchy/Subscription.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Subscription = ({ user, onUpgradeSuccess, theme, palette, isMobile, isTablet }) => {
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [subscription, setSubscription] = useState(null);
    const [selectedTier, setSelectedTier] = useState('basic');

    const tiers = [
        {
            id: 'basic',
            name: 'Basic',
            price: '$9.99/month',
            features: [
                '1 Group',
                'Up to 10 members',
                'Basic VPN features',
                'Standard firewall rules',
                'Email support'
            ],
            maxGroups: 1,
            maxMembers: 10
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '$29.99/month',
            features: [
                '5 Groups',
                'Up to 50 members per group',
                'Advanced VPN features',
                'Custom firewall rules',
                'Priority support',
                'Analytics dashboard'
            ],
            maxGroups: 5,
            maxMembers: 50,
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: '$99.99/month',
            features: [
                'Unlimited Groups',
                'Unlimited members',
                'Enterprise VPN features',
                'Advanced security rules',
                '24/7 Premium support',
                'Custom integrations',
                'Dedicated account manager'
            ],
            maxGroups: 999,
            maxMembers: 999
        }
    ];

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const response = await hierarchyAPI.getMySubscription();
            if (response.success) {
                setSubscription(response.subscription);
            }
        } catch (error) {
            console.error('Fetch subscription error:', error);
        }
    };

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // For now, this is a mock upgrade. Later integrate with Stripe/PayPal
            const response = await hierarchyAPI.upgradeToLeader(selectedTier);

            if (response.success || response.message === 'Not implemented yet') {
                alert(`Upgrade to ${selectedTier} tier successful! (Mock payment)`);

                // Update user in parent component
                if (onUpgradeSuccess) {
                    onUpgradeSuccess({
                        ...user,
                        accountType: 'leader',
                        subscriptionTier: selectedTier,
                        isPaid: true
                    });
                }
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            alert('Upgrade failed: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const isCurrentTier = (tierId) => {
        return user?.subscriptionTier === tierId;
    };

    return (
        <div style={{
            flex: 1,
            padding: isMobile ? '16px' : isTablet ? '24px' : '40px',
            backgroundColor: palette.bgMain,
            color: palette.text,
            minHeight: '100vh'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '600', margin: '0 0 8px 0', color: palette.text }}>
                        Upgrade to Leader
                    </h1>
                    <p style={{ color: palette.textMuted, margin: 0 }}>
                        Choose a plan to create groups and manage team members
                    </p>
                </div>

                {/* Current Status */}
                {user?.accountType === 'leader' && (
                    <div style={{
                        marginBottom: '32px',
                        padding: '24px',
                        backgroundColor: theme === 'light' ? 'rgba(34, 197, 94, 0.1)' : palette.accentSoft,
                        border: `1px solid ${palette.accent}`,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: `${palette.accent}20`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                        }}>
                            👑
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '600', color: palette.accent, margin: '0 0 4px 0' }}>
                                You're a Leader!
                            </h2>
                            <p style={{ color: palette.textMuted, margin: 0 }}>
                                Current plan: <span style={{ color: palette.text, fontWeight: '600', textTransform: 'capitalize' }}>{user.subscriptionTier}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: '24px',
                    marginBottom: '32px'
                }}>
                    {tiers.map((tier) => (
                        <div
                            key={tier.id}
                            style={{
                                position: 'relative',
                                padding: '24px',
                                backgroundColor: palette.bgCard,
                                borderRadius: '12px',
                                border: `2px solid ${selectedTier === tier.id ? palette.accent : palette.border}`,
                                transition: 'all 0.2s',
                                boxShadow: tier.popular ? `0 0 0 2px ${palette.accent}` : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (!isCurrentTier(tier.id)) {
                                    e.currentTarget.style.borderColor = palette.accent;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedTier !== tier.id && !isCurrentTier(tier.id)) {
                                    e.currentTarget.style.borderColor = palette.border;
                                }
                            }}
                        >
                            {/* Popular Badge */}
                            {tier.popular && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)'
                                }}>
                                    <span style={{
                                        padding: '4px 16px',
                                        backgroundColor: palette.accent,
                                        color: theme === 'light' ? '#ffffff' : palette.bgMain,
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        borderRadius: '12px'
                                    }}>
                                        POPULAR
                                    </span>
                                </div>
                            )}

                            {/* Current Badge */}
                            {isCurrentTier(tier.id) && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    right: '16px'
                                }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        backgroundColor: palette.accent,
                                        color: theme === 'light' ? '#ffffff' : palette.bgMain,
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        borderRadius: '12px'
                                    }}>
                                        CURRENT
                                    </span>
                                </div>
                            )}

                            {/* Tier Header */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0', color: palette.text }}>
                                    {tier.name}
                                </h3>
                                <div style={{ fontSize: '32px', fontWeight: '700', color: palette.accent, marginBottom: '16px' }}>
                                    {tier.price}
                                </div>
                            </div>

                            {/* Features List */}
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                                {tier.features.map((feature, index) => (
                                    <li key={index} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        marginBottom: '12px'
                                    }}>
                                        <span style={{ color: palette.accent, marginTop: '2px' }}>✓</span>
                                        <span style={{ color: palette.textMuted, fontSize: '14px' }}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Select Button */}
                            <button
                                onClick={() => setSelectedTier(tier.id)}
                                disabled={isCurrentTier(tier.id)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: isCurrentTier(tier.id) ? 'not-allowed' : 'pointer',
                                    backgroundColor: isCurrentTier(tier.id)
                                        ? palette.bgPanel
                                        : selectedTier === tier.id
                                            ? palette.accent
                                            : palette.bgPanel,
                                    color: isCurrentTier(tier.id)
                                        ? palette.textMuted
                                        : selectedTier === tier.id
                                            ? (theme === 'light' ? '#ffffff' : palette.bgMain)
                                            : palette.text,
                                    transition: 'all 0.2s',
                                    opacity: isCurrentTier(tier.id) ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!isCurrentTier(tier.id) && selectedTier !== tier.id) {
                                        e.currentTarget.style.backgroundColor = palette.accent;
                                        e.currentTarget.style.color = theme === 'light' ? '#ffffff' : palette.bgMain;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isCurrentTier(tier.id) && selectedTier !== tier.id) {
                                        e.currentTarget.style.backgroundColor = palette.bgPanel;
                                        e.currentTarget.style.color = palette.text;
                                    }
                                }}
                            >
                                {isCurrentTier(tier.id) ? 'Current Plan' : selectedTier === tier.id ? 'Selected' : 'Select Plan'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Action Button */}
                {user?.accountType !== 'leader' && (
                    <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            style={{
                                padding: '16px 32px',
                                backgroundColor: palette.accent,
                                color: theme === 'light' ? '#ffffff' : palette.bgMain,
                                borderRadius: '8px',
                                fontWeight: '700',
                                fontSize: '18px',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.5 : 1,
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {loading ? 'Processing...' : `Upgrade to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`}
                        </button>
                        <p style={{ marginTop: '16px', color: palette.textMuted, fontSize: '14px' }}>
                            Payment integration coming soon. Currently using mock payment for testing.
                        </p>
                    </div>
                )}

                {/* FAQ Section */}
                <div style={{
                    padding: isMobile ? '20px' : '24px',
                    backgroundColor: palette.bgCard,
                    borderRadius: '12px',
                    border: `1px solid ${palette.border}`
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: palette.text }}>
                        Frequently Asked Questions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                        <div>
                            <p style={{ fontWeight: '600', color: palette.text, marginBottom: '4px' }}>
                                What can I do as a Leader?
                            </p>
                            <p style={{ color: palette.textMuted, margin: 0 }}>
                                Leaders can create groups, invite members, and manage security configurations for their team members.
                            </p>
                        </div>
                        <div>
                            <p style={{ fontWeight: '600', color: palette.text, marginBottom: '4px' }}>
                                Can I cancel anytime?
                            </p>
                            <p style={{ color: palette.textMuted, margin: 0 }}>
                                Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.
                            </p>
                        </div>
                        <div>
                            <p style={{ fontWeight: '600', color: palette.text, marginBottom: '4px' }}>
                                What happens to my groups if I downgrade?
                            </p>
                            <p style={{ color: palette.textMuted, margin: 0 }}>
                                Your groups will remain active, but you won't be able to create new ones if you exceed the limit of your new tier.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscription;