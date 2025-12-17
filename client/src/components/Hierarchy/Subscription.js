// src/components/Hierarchy/Subscription.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';

const Subscription = ({ user, onUpgradeSuccess }) => {
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
        <div className="min-h-screen bg-background-dark text-text-light p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Upgrade to Leader</h1>
                    <p className="text-text-muted">
                        Choose a plan to create groups and manage team members
                    </p>
                </div>

                {/* Current Status */}
                {user?.accountType === 'leader' && (
                    <div className="mb-8 p-6 bg-form-background-dark border border-primary rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                                <span className="text-2xl">👑</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-primary">You're a Leader!</h2>
                                <p className="text-text-muted">
                                    Current plan: <span className="text-text-light font-semibold capitalize">{user.subscriptionTier}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                    {tiers.map((tier) => (
                        <div
                            key={tier.id}
                            className={`relative p-6 rounded-lg border-2 transition-all ${selectedTier === tier.id
                                    ? 'border-primary bg-form-background-dark'
                                    : 'border-input-background-dark bg-form-background-dark hover:border-primary'
                                } ${tier.popular ? 'ring-2 ring-primary' : ''}`}
                        >
                            {/* Popular Badge */}
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="px-4 py-1 bg-primary text-background-dark text-sm font-bold rounded-full">
                                        POPULAR
                                    </span>
                                </div>
                            )}

                            {/* Current Badge */}
                            {isCurrentTier(tier.id) && (
                                <div className="absolute -top-3 right-4">
                                    <span className="px-3 py-1 bg-primary text-background-dark text-xs font-bold rounded-full">
                                        CURRENT
                                    </span>
                                </div>
                            )}

                            {/* Tier Header */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                                <div className="text-3xl font-bold text-primary mb-4">
                                    {tier.price}
                                </div>
                            </div>

                            {/* Features List */}
                            <ul className="space-y-3 mb-6">
                                {tier.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-primary mt-1">✓</span>
                                        <span className="text-text-muted text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Select Button */}
                            <button
                                onClick={() => setSelectedTier(tier.id)}
                                disabled={isCurrentTier(tier.id)}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${isCurrentTier(tier.id)
                                        ? 'bg-input-background-dark text-text-muted cursor-not-allowed'
                                        : selectedTier === tier.id
                                            ? 'bg-primary text-background-dark'
                                            : 'bg-input-background-dark text-text-light hover:bg-primary hover:text-background-dark'
                                    }`}
                            >
                                {isCurrentTier(tier.id) ? 'Current Plan' : selectedTier === tier.id ? 'Selected' : 'Select Plan'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Action Button */}
                {user?.accountType !== 'leader' && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="px-8 py-4 bg-primary text-background-dark rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : `Upgrade to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`}
                        </button>
                        <p className="mt-4 text-text-muted text-sm">
                            Payment integration coming soon. Currently using mock payment for testing.
                        </p>
                    </div>
                )}

                {/* FAQ Section */}
                <div className="mt-12 p-6 bg-form-background-dark rounded-lg border border-input-background-dark">
                    <h3 className="text-xl font-bold mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="font-semibold text-text-light mb-1">What can I do as a Leader?</p>
                            <p className="text-text-muted">
                                Leaders can create groups, invite members, and manage security configurations for their team members.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-text-light mb-1">Can I cancel anytime?</p>
                            <p className="text-text-muted">
                                Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-text-light mb-1">What happens to my groups if I downgrade?</p>
                            <p className="text-text-muted">
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