'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthContext'
import { useTeam } from '@/components/TeamContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  Key,
  Globe,
  CreditCard,
  FileText,
  Trash2,
  Edit,
  Plus,
  Check,
  X
} from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  role: string
  joined_at: string
  status: 'active' | 'pending'
}

interface TeamSettings {
  team_name: string
  description: string
  timezone: string
  currency: string
  tax_rate: number
  payment_terms: string
  invoice_prefix: string
  auto_numbering: boolean
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { currentTeam, canManageTeam } = useTeam()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [teamSettings, setTeamSettings] = useState<TeamSettings>({
    team_name: currentTeam?.team_name || '',
    description: currentTeam?.description || '',
    timezone: 'America/New_York',
    currency: 'USD',
    tax_rate: 8.0,
    payment_terms: 'Net 30',
    invoice_prefix: 'INV',
    auto_numbering: true
  })
  const [members, setMembers] = useState<TeamMember[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  useEffect(() => {
    if (currentTeam) {
      fetchTeamMembers()
    }
  }, [currentTeam])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/teams/${currentTeam?.team_id}/members`)
      if (response.ok) {
        const result = await response.json()
        setMembers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${currentTeam?.team_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamSettings),
      })

      if (response.ok) {
        // Show success message
        console.log('Settings saved successfully')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${currentTeam?.team_id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        }),
      })

      if (response.ok) {
        setInviteEmail('')
        setInviteRole('member')
        setShowInviteForm(false)
        fetchTeamMembers() // Refresh the list
      }
    } catch (error) {
      console.error('Error inviting member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${currentTeam?.team_id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTeamMembers() // Refresh the list
      }
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'members', label: 'Team Members', icon: Users },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'advanced', label: 'Advanced', icon: Key }
  ]

  if (!canManageTeam) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Access Restricted</h1>
            <p className="text-purple-200 mb-8 max-w-md mx-auto">
              You need admin permissions to access team settings. Please contact your team admin to request access.
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-purple-200">
            Manage your team settings and preferences for {currentTeam?.team_name}
          </p>
        </div>

        {/* Settings Layout */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-purple-600/30 text-white'
                          : 'text-purple-200 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                          Team Name *
                        </label>
                        <input
                          type="text"
                          value={teamSettings.team_name}
                          onChange={(e) => setTeamSettings(prev => ({ ...prev, team_name: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Enter team name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                          Timezone
                        </label>
                        <select
                          value={teamSettings.timezone}
                          onChange={(e) => setTeamSettings(prev => ({ ...prev, timezone: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                          Currency
                        </label>
                        <select
                          value={teamSettings.currency}
                          onChange={(e) => setTeamSettings(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD (C$)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={teamSettings.tax_rate}
                          onChange={(e) => setTeamSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="8.0"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                          Payment Terms
                        </label>
                        <input
                          type="text"
                          value={teamSettings.payment_terms}
                          onChange={(e) => setTeamSettings(prev => ({ ...prev, payment_terms: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="Net 30"
                        />
                      </div>

                      <div>
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                          Invoice Prefix
                        </label>
                        <input
                          type="text"
                          value={teamSettings.invoice_prefix}
                          onChange={(e) => setTeamSettings(prev => ({ ...prev, invoice_prefix: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="INV"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={teamSettings.auto_numbering}
                          onChange={(e) => setTeamSettings(prev => ({ ...prev, auto_numbering: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <span className="text-purple-200">Enable automatic invoice numbering</span>
                      </label>
                    </div>

                    <div className="mt-8">
                      <label className="block text-purple-200 text-sm font-medium mb-2">
                        Team Description
                      </label>
                      <textarea
                        value={teamSettings.description}
                        onChange={(e) => setTeamSettings(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                        placeholder="Describe your team's purpose and focus..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Team Members */}
              {activeTab === 'members' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Team Members</h2>
                    <Button
                      onClick={() => setShowInviteForm(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  </div>

                  {/* Invite Form */}
                  {showInviteForm && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <h3 className="text-lg font-semibold text-white mb-4">Invite New Member</h3>
                      <form onSubmit={handleInviteMember} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              required
                              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              placeholder="member@example.com"
                            />
                          </div>
                          <div>
                            <label className="block text-purple-200 text-sm font-medium mb-2">
                              Role
                            </label>
                            <select
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value)}
                              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                              <option value="member">Member</option>
                              <option value="accountant">Accountant</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300"
                          >
                            {loading ? 'Sending...' : 'Send Invitation'}
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setShowInviteForm(false)}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 py-2 px-4 rounded-xl"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-4 text-purple-200 font-medium">Member</th>
                          <th className="text-left p-4 text-purple-200 font-medium">Role</th>
                          <th className="text-left p-4 text-purple-200 font-medium">Status</th>
                          <th className="text-left p-4 text-purple-200 font-medium">Joined</th>
                          <th className="text-right p-4 text-purple-200 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr key={member.id} className="border-b border-white/5">
                            <td className="p-4">
                              <div className="text-white">{member.email}</div>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                member.role === 'admin' ? 'bg-red-600/30 text-red-200' :
                                member.role === 'accountant' ? 'bg-blue-600/30 text-blue-200' :
                                'bg-gray-600/30 text-gray-200'
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                member.status === 'active' ? 'bg-green-600/30 text-green-200' : 'bg-yellow-600/30 text-yellow-200'
                              }`}>
                                {member.status}
                              </span>
                            </td>
                            <td className="p-4 text-purple-200 text-sm">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-200 hover:bg-blue-500/30 transition-all duration-300 p-2 rounded-lg">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 hover:bg-red-500/30 transition-all duration-300 p-2 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Other tabs placeholder */}
              {activeTab !== 'general' && activeTab !== 'members' && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Settings className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {tabs.find(t => t.id === activeTab)?.label} Settings
                  </h2>
                  <p className="text-purple-200">
                    This section is under development. More settings will be available soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
