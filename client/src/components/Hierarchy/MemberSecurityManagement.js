// src/components/Hierarchy/MemberSecurityManagement.js
import React, { useState, useEffect } from 'react';
import { hierarchyAPI } from '../../services/hierarchyAPI';
import api from '../../services/api';
import { FiSettings, FiShield, FiWifi, FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';

const MemberSecurityManagement = ({ user, theme = 'dark', palette = null }) => {
  const darkPalette = {
    bgMain: '#121212', bgCard: '#181818', bgPanel: '#0a0a0a', text: '#ffffff',
    textMuted: '#9aa3b5', border: '#242424', accent: '#36E27B', accentSoft: 'rgba(54, 226, 123, 0.12)',
    danger: '#e04848', warning: '#f0a500'
  };
  const lightPalette = {
    bgMain: '#f6f8fb', bgCard: '#ffffff', bgPanel: '#f9fafb', text: '#0b172a',
    textMuted: '#5b6b7a', border: '#d9e2ec', accent: '#1fa45a', accentSoft: 'rgba(31, 164, 90, 0.12)',
    danger: '#dc2626', warning: '#d97706'
  };
  const colors = palette || (theme === 'light' ? lightPalette : darkPalette);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [memberFirewallRules, setMemberFirewallRules] = useState([]);
  const [memberVPNConfigs, setMemberVPNConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Editing states
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingFirewallRule, setEditingFirewallRule] = useState(null);
  const [editingVPNConfig, setEditingVPNConfig] = useState(null);

  useEffect(() => {
    if (user?.accountType === 'leader') {
      fetchGroupMembers();
    }
  }, [user]);

  const fetchGroupMembers = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch user's groups
      const groupsResponse = await hierarchyAPI.getMyGroups();
      if (groupsResponse.success && groupsResponse.groups.length > 0) {
        const allMembers = [];

        // Fetch members for each group
        for (const group of groupsResponse.groups) {
          try {
            const membersResponse = await hierarchyAPI.getGroupMembers(group.id);
            if (membersResponse.success) {
              allMembers.push(...membersResponse.members.map(member => ({
                ...member,
                groupName: group.name,
                groupId: group.id
              })));
            }
          } catch (err) {
            console.error('Error fetching members for group:', group.id, err);
          }
        }

        setMembers(allMembers);
      }
    } catch (err) {
      console.error('Error fetching group members:', err);
      setError('Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberSecurityData = async (memberId) => {
    try {
      setActionLoading(true);

      // Fetch member's profiles
      const profilesResponse = await api.get(`/hierarchy/members/${memberId}/profiles`);
      if (profilesResponse.data.success) {
        setMemberProfiles(profilesResponse.data.profiles || []);
      }

      // Fetch member's firewall rules
      const firewallResponse = await api.get(`/hierarchy/members/${memberId}/firewall`);
      if (firewallResponse.data.success) {
        setMemberFirewallRules(firewallResponse.data.rules || []);
      }

      // Fetch member's VPN configs
      const vpnResponse = await api.get(`/hierarchy/members/${memberId}/vpn`);
      if (vpnResponse.data.success) {
        setMemberVPNConfigs(vpnResponse.data.configs || []);
      }

    } catch (err) {
      console.error('Error fetching member security data:', err);
      setError('Failed to load member security data');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    fetchMemberSecurityData(member.userId);
    setActiveTab('overview');
  };

  const updateMemberProfile = async (profileId, updates) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/hierarchy/members/${selectedMember.userId}/profiles/${profileId}`, updates);

      if (response.data.success) {
        // Refresh member profiles
        fetchMemberSecurityData(selectedMember.userId);
        alert('Profile updated successfully');
      }
    } catch (err) {
      console.error('Error updating member profile:', err);
      alert('Failed to update profile');
    } finally {
      setActionLoading(false);
    }
  };

  const updateMemberFirewallRule = async (ruleId, updates) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/hierarchy/members/${selectedMember.userId}/firewall/${ruleId}`, updates);

      if (response.data.success) {
        // Refresh member firewall rules
        fetchMemberSecurityData(selectedMember.userId);
        alert('Firewall rule updated successfully');
      }
    } catch (err) {
      console.error('Error updating firewall rule:', err);
      alert('Failed to update firewall rule');
    } finally {
      setActionLoading(false);
    }
  };

  const updateMemberVPNConfig = async (configId, updates) => {
    try {
      setActionLoading(true);
      const response = await api.put(`/hierarchy/members/${selectedMember.userId}/vpn/${configId}`, updates);

      if (response.data.success) {
        // Refresh member VPN configs
        fetchMemberSecurityData(selectedMember.userId);
        alert('VPN configuration updated successfully');
      }
    } catch (err) {
      console.error('Error updating VPN config:', err);
      alert('Failed to update VPN configuration');
    } finally {
      setActionLoading(false);
    }
  };

  if (user?.accountType !== 'leader') {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: colors.bgMain,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.text
      }}>
        <div style={{
          textAlign: 'center',
          padding: '32px',
          backgroundColor: colors.bgCard,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          maxWidth: '500px'
        }}>
          <FiLock style={{ width: '48px', height: '48px', color: colors.danger, marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ color: colors.textMuted }}>
            Only group leaders can access member security management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      backgroundColor: colors.bgMain,
      minHeight: '100vh',
      color: colors.text
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FiShield style={{ width: '32px', height: '32px' }} />
            Member Security Management
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '16px' }}>
            Control and monitor your team members' security configurations
          </p>
        </div>

        {/* Warning */}
        <div style={{
          padding: '16px',
          backgroundColor: colors.warning + '20',
          border: `1px solid ${colors.warning}`,
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <FiAlertCircle style={{ width: '20px', height: '20px', color: colors.warning, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ margin: 0, fontWeight: '500', color: colors.text }}>
              Leader Responsibility Notice
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.textMuted }}>
              You can modify your members' security settings. Use this power responsibly as it affects their security posture.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 0',
            color: colors.textMuted
          }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
            <p>Loading group members...</p>
          </div>
        ) : error ? (
          <div style={{
            padding: '16px',
            backgroundColor: colors.danger + '20',
            border: `1px solid ${colors.danger}`,
            borderRadius: '8px',
            color: colors.danger,
            marginBottom: '24px'
          }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Members List */}
            <div style={{
              width: '320px',
              backgroundColor: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FiUser style={{ width: '18px', height: '18px' }} />
                Group Members ({members.length})
              </h3>

              {members.length === 0 ? (
                <p style={{ color: colors.textMuted, textAlign: 'center', padding: '20px' }}>
                  No group members found
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members.map((member) => (
                    <div
                      key={`${member.groupId}-${member.userId}`}
                      onClick={() => handleMemberSelect(member)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${
                          selectedMember?.userId === member.userId ? colors.accent : colors.border
                        }`,
                        backgroundColor: selectedMember?.userId === member.userId
                          ? colors.accentSoft
                          : (theme === 'light' ? '#f9fafb' : colors.bgPanel),
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {member.user?.email}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>{member.groupName}</span>
                        <span>Role: {member.role || 'Member'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Security Panel */}
            <div style={{ flex: 1 }}>
              {selectedMember ? (
                <div style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  {/* Member Header */}
                  <div style={{
                    padding: '20px',
                    borderBottom: `1px solid ${colors.border}`,
                    backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel
                  }}>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiSettings style={{ width: '20px', height: '20px' }} />
                      {selectedMember.user?.email}
                    </h2>
                    <p style={{
                      margin: '4px 0 0 0',
                      color: colors.textMuted,
                      fontSize: '14px'
                    }}>
                      Group: {selectedMember.groupName} • Role: {selectedMember.role || 'Member'}
                    </p>
                  </div>

                  {/* Tabs */}
                  <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${colors.border}`
                  }}>
                    {[
                      { id: 'overview', label: 'Overview', icon: FiShield },
                      { id: 'profiles', label: 'Profiles', icon: FiUser },
                      { id: 'firewall', label: 'Firewall', icon: FiLock },
                      { id: 'vpn', label: 'VPN', icon: FiWifi }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          flex: 1,
                          padding: '16px',
                          backgroundColor: activeTab === tab.id ? colors.accentSoft : 'transparent',
                          border: 'none',
                          borderBottom: activeTab === tab.id ? `2px solid ${colors.accent}` : 'none',
                          color: activeTab === tab.id ? colors.accent : colors.textMuted,
                          fontWeight: activeTab === tab.id ? '600' : '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <tab.icon style={{ width: '16px', height: '16px' }} />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div style={{ padding: '20px' }}>
                    {actionLoading ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: colors.textMuted
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
                        <p>Loading...</p>
                      </div>
                    ) : (
                      <>
                        {activeTab === 'overview' && (
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                              Security Overview
                            </h3>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '16px'
                            }}>
                              <div style={{
                                padding: '16px',
                                backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel,
                                borderRadius: '8px',
                                border: `1px solid ${colors.border}`
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '8px'
                                }}>
                                  <FiUser style={{ width: '16px', height: '16px', color: colors.accent }} />
                                  <span style={{ fontWeight: '500' }}>Profiles</span>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '600' }}>
                                  {memberProfiles.length}
                                </div>
                              </div>

                              <div style={{
                                padding: '16px',
                                backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel,
                                borderRadius: '8px',
                                border: `1px solid ${colors.border}`
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '8px'
                                }}>
                                  <FiLock style={{ width: '16px', height: '16px', color: colors.accent }} />
                                  <span style={{ fontWeight: '500' }}>Firewall Rules</span>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '600' }}>
                                  {memberFirewallRules.length}
                                </div>
                              </div>

                              <div style={{
                                padding: '16px',
                                backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel,
                                borderRadius: '8px',
                                border: `1px solid ${colors.border}`
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '8px'
                                }}>
                                  <FiWifi style={{ width: '16px', height: '16px', color: colors.accent }} />
                                  <span style={{ fontWeight: '500' }}>VPN Configs</span>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '600' }}>
                                  {memberVPNConfigs.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'profiles' && (
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                              Security Profiles
                            </h3>
                            {memberProfiles.length === 0 ? (
                              <p style={{ color: colors.textMuted }}>No profiles configured</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {memberProfiles.map((profile) => (
                                  <div key={profile.id} style={{
                                    padding: '16px',
                                    backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel,
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.border}`
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: '8px'
                                    }}>
                                      <h4 style={{ margin: 0, fontWeight: '500' }}>{profile.name}</h4>
                                      <span style={{
                                        padding: '4px 8px',
                                        backgroundColor: profile.isActive ? colors.accentSoft : colors.border,
                                        color: profile.isActive ? colors.accent : colors.textMuted,
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                      }}>
                                        {profile.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: colors.textMuted }}>
                                      {profile.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={() => setEditingProfile(editingProfile?.id === profile.id ? null : profile)}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: colors.warning,
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px'
                                        }}
                                      >
                                        {editingProfile?.id === profile.id ? 'Cancel Edit' : 'Edit'}
                                      </button>
                                      <button
                                        onClick={() => updateMemberProfile(profile.id, { isActive: !profile.isActive })}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: profile.isActive ? colors.danger : colors.accent,
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px'
                                        }}
                                      >
                                        {profile.isActive ? 'Deactivate' : 'Activate'}
                                      </button>
                                    </div>

                                    {/* Edit Form */}
                                    {editingProfile?.id === profile.id && (
                                      <div style={{
                                        marginTop: '16px',
                                        padding: '16px',
                                        backgroundColor: theme === 'light' ? '#f8fafc' : colors.bgMain,
                                        borderRadius: '8px',
                                        border: `1px solid ${colors.border}`
                                      }}>
                                        <h5 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Edit Profile</h5>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                          <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                              Profile Name
                                            </label>
                                            <input
                                              type="text"
                                              value={editingProfile.name || ''}
                                              onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                                              style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: '4px',
                                                backgroundColor: colors.bgMain,
                                                color: colors.text,
                                                fontSize: '14px'
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                              Description
                                            </label>
                                            <textarea
                                              value={editingProfile.description || ''}
                                              onChange={(e) => setEditingProfile({...editingProfile, description: e.target.value})}
                                              rows={3}
                                              style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: '4px',
                                                backgroundColor: colors.bgMain,
                                                color: colors.text,
                                                fontSize: '14px',
                                                resize: 'vertical'
                                              }}
                                            />
                                          </div>
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                              onClick={() => {
                                                updateMemberProfile(profile.id, {
                                                  name: editingProfile.name,
                                                  description: editingProfile.description
                                                });
                                                setEditingProfile(null);
                                              }}
                                              style={{
                                                padding: '8px 16px',
                                                backgroundColor: colors.accent,
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                            >
                                              Save Changes
                                            </button>
                                            <button
                                              onClick={() => setEditingProfile(null)}
                                              style={{
                                                padding: '8px 16px',
                                                backgroundColor: colors.border,
                                                color: colors.text,
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'firewall' && (
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                              Firewall Rules
                            </h3>
                            {memberFirewallRules.length === 0 ? (
                              <p style={{ color: colors.textMuted }}>No firewall rules configured</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {memberFirewallRules.map((rule) => (
                                  <div key={rule.id} style={{
                                    padding: '16px',
                                    backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel,
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.border}`
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: '8px'
                                    }}>
                                      <h4 style={{ margin: 0, fontWeight: '500' }}>{rule.name}</h4>
                                      <span style={{
                                        padding: '4px 8px',
                                        backgroundColor: rule.isActive ? colors.accentSoft : colors.border,
                                        color: rule.isActive ? colors.accent : colors.textMuted,
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                      }}>
                                        {rule.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '12px' }}>
                                      <div>Action: {rule.action}</div>
                                      <div>Source: {rule.sourceIP}</div>
                                      <div>Destination: {rule.destinationIP}</div>
                                      <div>Port: {rule.port}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={() => setEditingFirewallRule(editingFirewallRule?.id === rule.id ? null : rule)}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: colors.warning,
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px'
                                        }}
                                      >
                                        {editingFirewallRule?.id === rule.id ? 'Cancel Edit' : 'Edit'}
                                      </button>
                                      <button
                                        onClick={() => updateMemberFirewallRule(rule.id, { isActive: !rule.isActive })}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: rule.isActive ? colors.danger : colors.accent,
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px'
                                        }}
                                      >
                                        {rule.isActive ? 'Disable' : 'Enable'}
                                      </button>
                                    </div>

                                    {/* Edit Form */}
                                    {editingFirewallRule?.id === rule.id && (
                                      <div style={{
                                        marginTop: '16px',
                                        padding: '16px',
                                        backgroundColor: theme === 'light' ? '#f8fafc' : colors.bgMain,
                                        borderRadius: '8px',
                                        border: `1px solid ${colors.border}`
                                      }}>
                                        <h5 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Edit Firewall Rule</h5>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                          <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                              Rule Name
                                            </label>
                                            <input
                                              type="text"
                                              value={editingFirewallRule.name || ''}
                                              onChange={(e) => setEditingFirewallRule({...editingFirewallRule, name: e.target.value})}
                                              style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: '4px',
                                                backgroundColor: colors.bgMain,
                                                color: colors.text,
                                                fontSize: '14px'
                                              }}
                                            />
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                                Action
                                              </label>
                                              <select
                                                value={editingFirewallRule.action || 'ALLOW'}
                                                onChange={(e) => setEditingFirewallRule({...editingFirewallRule, action: e.target.value})}
                                                style={{
                                                  width: '100%',
                                                  padding: '8px',
                                                  border: `1px solid ${colors.border}`,
                                                  borderRadius: '4px',
                                                  backgroundColor: colors.bgMain,
                                                  color: colors.text,
                                                  fontSize: '14px'
                                                }}
                                              >
                                                <option value="ALLOW">ALLOW</option>
                                                <option value="DENY">DENY</option>
                                              </select>
                                            </div>
                                            <div>
                                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                                Direction
                                              </label>
                                              <select
                                                value={editingFirewallRule.direction || 'INBOUND'}
                                                onChange={(e) => setEditingFirewallRule({...editingFirewallRule, direction: e.target.value})}
                                                style={{
                                                  width: '100%',
                                                  padding: '8px',
                                                  border: `1px solid ${colors.border}`,
                                                  borderRadius: '4px',
                                                  backgroundColor: colors.bgMain,
                                                  color: colors.text,
                                                  fontSize: '14px'
                                                }}
                                              >
                                                <option value="INBOUND">INBOUND</option>
                                                <option value="OUTBOUND">OUTBOUND</option>
                                              </select>
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                              onClick={() => {
                                                updateMemberFirewallRule(rule.id, {
                                                  name: editingFirewallRule.name,
                                                  action: editingFirewallRule.action,
                                                  direction: editingFirewallRule.direction
                                                });
                                                setEditingFirewallRule(null);
                                              }}
                                              style={{
                                                padding: '8px 16px',
                                                backgroundColor: colors.accent,
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                            >
                                              Save Changes
                                            </button>
                                            <button
                                              onClick={() => setEditingFirewallRule(null)}
                                              style={{
                                                padding: '8px 16px',
                                                backgroundColor: colors.border,
                                                color: colors.text,
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'vpn' && (
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                              VPN Configurations
                            </h3>
                            {memberVPNConfigs.length === 0 ? (
                              <p style={{ color: colors.textMuted }}>No VPN configurations</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {memberVPNConfigs.map((config) => (
                                  <div key={config.id} style={{
                                    padding: '16px',
                                    backgroundColor: theme === 'light' ? '#f9fafb' : colors.bgPanel,
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.border}`
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      marginBottom: '8px'
                                    }}>
                                      <h4 style={{ margin: 0, fontWeight: '500' }}>{config.name}</h4>
                                      <span style={{
                                        padding: '4px 8px',
                                        backgroundColor: config.isActive ? colors.accentSoft : colors.border,
                                        color: config.isActive ? colors.accent : colors.textMuted,
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                      }}>
                                        {config.isActive ? 'Connected' : 'Disconnected'}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '12px' }}>
                                      <div>Server: {config.serverAddress}</div>
                                      <div>Protocol: {config.protocol}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={() => setEditingVPNConfig(editingVPNConfig?.id === config.id ? null : config)}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: colors.warning,
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px'
                                        }}
                                      >
                                        {editingVPNConfig?.id === config.id ? 'Cancel Edit' : 'Edit'}
                                      </button>
                                      <button
                                        onClick={() => updateMemberVPNConfig(config.id, { isActive: !config.isActive })}
                                        style={{
                                          padding: '6px 12px',
                                          backgroundColor: config.isActive ? colors.danger : colors.accent,
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '12px'
                                        }}
                                      >
                                        {config.isActive ? 'Disconnect' : 'Connect'}
                                      </button>
                                    </div>

                                    {/* Edit Form */}
                                    {editingVPNConfig?.id === config.id && (
                                      <div style={{
                                        marginTop: '16px',
                                        padding: '16px',
                                        backgroundColor: theme === 'light' ? '#f8fafc' : colors.bgMain,
                                        borderRadius: '8px',
                                        border: `1px solid ${colors.border}`
                                      }}>
                                        <h5 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Edit VPN Configuration</h5>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                          <div>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                              Configuration Name
                                            </label>
                                            <input
                                              type="text"
                                              value={editingVPNConfig.name || ''}
                                              onChange={(e) => setEditingVPNConfig({...editingVPNConfig, name: e.target.value})}
                                              style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: '4px',
                                                backgroundColor: colors.bgMain,
                                                color: colors.text,
                                                fontSize: '14px'
                                              }}
                                            />
                                          </div>
                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                                Server Address
                                              </label>
                                              <input
                                                type="text"
                                                value={editingVPNConfig.serverAddress || ''}
                                                onChange={(e) => setEditingVPNConfig({...editingVPNConfig, serverAddress: e.target.value})}
                                                style={{
                                                  width: '100%',
                                                  padding: '8px',
                                                  border: `1px solid ${colors.border}`,
                                                  borderRadius: '4px',
                                                  backgroundColor: colors.bgMain,
                                                  color: colors.text,
                                                  fontSize: '14px'
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                                Protocol
                                              </label>
                                              <select
                                                value={editingVPNConfig.protocol || 'OpenVPN'}
                                                onChange={(e) => setEditingVPNConfig({...editingVPNConfig, protocol: e.target.value})}
                                                style={{
                                                  width: '100%',
                                                  padding: '8px',
                                                  border: `1px solid ${colors.border}`,
                                                  borderRadius: '4px',
                                                  backgroundColor: colors.bgMain,
                                                  color: colors.text,
                                                  fontSize: '14px'
                                                }}
                                              >
                                                <option value="OpenVPN">OpenVPN</option>
                                                <option value="WireGuard">WireGuard</option>
                                                <option value="IKEv2">IKEv2</option>
                                              </select>
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                              onClick={() => {
                                                updateMemberVPNConfig(config.id, {
                                                  name: editingVPNConfig.name,
                                                  serverAddress: editingVPNConfig.serverAddress,
                                                  protocol: editingVPNConfig.protocol
                                                });
                                                setEditingVPNConfig(null);
                                              }}
                                              style={{
                                                padding: '8px 16px',
                                                backgroundColor: colors.accent,
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                            >
                                              Save Changes
                                            </button>
                                            <button
                                              onClick={() => setEditingVPNConfig(null)}
                                              style={{
                                                padding: '8px 16px',
                                                backgroundColor: colors.border,
                                                color: colors.text,
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  color: colors.textMuted
                }}>
                  <FiUser style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.5 }} />
                  <h3 style={{ margin: '0 0 8px 0' }}>Select a Member</h3>
                  <p>Choose a group member from the list to manage their security settings</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberSecurityManagement;
