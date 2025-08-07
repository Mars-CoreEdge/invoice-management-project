'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Users, Settings, UserPlus, Crown, Shield, Eye, Trash2, Edit, Mail, X, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface Team {
  id: string;
  team_name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  role: 'admin' | 'accountant' | 'viewer';
  member_count: number;
}

interface TeamMember {
  team_id: string;
  user_id: string;
  role: 'admin' | 'accountant' | 'viewer';
  joined_at: string;
  invited_by?: string;
  email?: string;
  full_name?: string;
}

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'accountant' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export default function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'accountant' | 'viewer'>('viewer');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
      fetchTeamInvitations(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setMessage({ type: 'error', text: 'Failed to load teams' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchTeamInvitations = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching team invitations:', error);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: newTeamName,
          description: newTeamDescription
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Team created successfully!' });
        setNewTeamName('');
        setNewTeamDescription('');
        setShowCreateTeam(false);
        fetchTeams();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to create team' });
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setMessage({ type: 'error', text: 'Failed to create team' });
    } finally {
      setActionLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail.trim() || !selectedTeam) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Invitation sent successfully!' });
        setInviteEmail('');
        setInviteRole('viewer');
        setShowInviteUser(false);
        fetchTeamInvitations(selectedTeam.id);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to send invitation' });
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setMessage({ type: 'error', text: 'Failed to send invitation' });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'accountant': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'viewer': return <Eye className="w-4 h-4 text-purple-300" />;
      default: return <Users className="w-4 h-4 text-purple-300" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'accountant': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'viewer': return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      default: return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Team Management</h2>
          <p className="text-purple-200">Manage your teams and collaborate with others</p>
        </div>
        <Button
          onClick={() => setShowCreateTeam(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200' 
            : 'bg-red-500/20 border-red-400/30 text-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <Check className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className={`bg-white/10 backdrop-blur-xl rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${
              selectedTeam?.id === team.id ? 'border-purple-400 shadow-xl' : 'border-white/20'
            }`}
            onClick={() => setSelectedTeam(team)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{team.team_name}</h3>
                  <p className="text-sm text-purple-200">{team.member_count} members</p>
                </div>
              </div>
              {team.is_owner && (
                <Crown className="w-5 h-5 text-yellow-400" />
              )}
            </div>
            
            {team.description && (
              <p className="text-purple-200 text-sm mb-4">{team.description}</p>
            )}

            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(team.role)}`}>
                {getRoleIcon(team.role)}
                <span className="ml-1 capitalize">{team.role}</span>
              </span>
              <span className="text-xs text-purple-300">
                {new Date(team.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Team Details */}
      {selectedTeam && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">{selectedTeam.team_name}</h3>
              <p className="text-purple-200">Team Details & Members</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowInviteUser(true)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0"
                disabled={!['admin'].includes(selectedTeam.role)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
              <Button
                variant="outline"
                className="border-purple-400/30 text-purple-300 hover:bg-purple-500/20"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Members Section */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">Team Members</h4>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(member.email || member.full_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.full_name || member.email}</p>
                      <p className="text-purple-200 text-sm">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      <span className="ml-1 capitalize">{member.role}</span>
                    </span>
                    {selectedTeam.is_owner && member.user_id !== selectedTeam.owner_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-400/30 text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invitations Section */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Pending Invitations</h4>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-purple-300" />
                    <div>
                      <p className="text-white font-medium">{invitation.email}</p>
                      <p className="text-purple-200 text-sm">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(invitation.role)}`}>
                      {getRoleIcon(invitation.role)}
                      <span className="ml-1 capitalize">{invitation.role}</span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-400/30 text-red-300 hover:bg-red-500/20"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {invitations.length === 0 && (
                <p className="text-purple-300 text-sm italic">No pending invitations</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Create New Team</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateTeam(false)}
                className="text-purple-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Team Name</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter team name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Description (Optional)</label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={createTeam}
                  disabled={actionLoading || !newTeamName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                >
                  {actionLoading ? 'Creating...' : 'Create Team'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTeam(false)}
                  className="border-purple-400/30 text-purple-300 hover:bg-purple-500/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteUser && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Invite User to {selectedTeam.team_name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInviteUser(false)}
                className="text-purple-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'accountant' | 'viewer')}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={inviteUser}
                  disabled={actionLoading || !inviteEmail.trim()}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0"
                >
                  {actionLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInviteUser(false)}
                  className="border-purple-400/30 text-purple-300 hover:bg-purple-500/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 