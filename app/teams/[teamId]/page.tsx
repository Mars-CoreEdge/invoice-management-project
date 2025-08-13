'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import * as Lucide from 'lucide-react'
const Users: any = (Lucide as any).Users || ((props: any) => <i {...props} />)
const UserPlus: any = (Lucide as any).UserPlus || ((props: any) => <i {...props} />)
const Settings: any = (Lucide as any).Settings || ((props: any) => <i {...props} />)
const Crown: any = (Lucide as any).Crown || ((props: any) => <i {...props} />)
const Shield: any = (Lucide as any).Shield || ((props: any) => <i {...props} />)
const Eye: any = (Lucide as any).Eye || ((props: any) => <i {...props} />)
const Trash2: any = (Lucide as any).Trash2 || ((props: any) => <i {...props} />)
const Edit: any = (Lucide as any).Edit || ((props: any) => <i {...props} />)
const Mail: any = (Lucide as any).Mail || ((props: any) => <i {...props} />)
const Calendar: any = (Lucide as any).Calendar || ((props: any) => <i {...props} />)
import { Team, TeamMember } from '@/types/teams'

interface TeamDetails extends Team {
  members: TeamMember[]
  invitations: any[]
}

export default function TeamManagementPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.teamId as string
  
  const [team, setTeam] = useState<TeamDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeamDetails()
  }, [teamId])

  const fetchTeamDetails = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      const result = await response.json()
      
      if (result.success) {
        setTeam(result.data)
      } else {
        setError(result.error || 'Failed to load team details')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-400" />
      case 'accountant':
        return <Settings className="w-4 h-4 text-blue-400" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-400" />
      default:
        return <Users className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-600/30 text-purple-200'
      case 'accountant':
        return 'bg-blue-600/30 text-blue-200'
      case 'viewer':
        return 'bg-gray-600/30 text-gray-200'
      default:
        return 'bg-gray-600/30 text-gray-200'
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading team details...</div>
        </div>
      </AppLayout>
    )
  }

  if (error || !team) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <div className="text-red-400 text-xl mb-4">Error</div>
          <div className="text-purple-200 mb-6">{error || 'Team not found'}</div>
          <Link href="/teams">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300">
              Back to Teams
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors mb-4"
          >
            ← Back to Teams
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{team.team_name}</h1>
              {team.description && (
                <p className="text-purple-200">{team.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Link href={`/teams/${teamId}/invite`}>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Invite Member
                </Button>
              </Link>
              <Link href={`/teams/${teamId}/edit`}>
                <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 py-3 px-6 rounded-xl">
                  <Edit className="w-5 h-5 mr-2" />
                  Edit Team
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{team.members.length}</div>
                <div className="text-purple-200 text-sm">Team Members</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{team.invitations?.length || 0}</div>
                <div className="text-purple-200 text-sm">Pending Invitations</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {new Date(team.created_at).toLocaleDateString()}
                </div>
                <div className="text-purple-200 text-sm">Created</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Team Members</h2>
            <Link href={`/teams/${teamId}/invite`}>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </Link>
          </div>

          {team.members.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-purple-200 mb-4">No members yet</div>
              <Link href={`/teams/${teamId}/invite`}>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300">
                  Invite First Member
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {team.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {(member as any).users?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {(member as any).users?.email || 'Unknown User'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleIcon(member.role)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                        {member.user_id === team.owner_id && (
                          <span className="text-xs bg-yellow-600/30 text-yellow-200 px-2 py-1 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-purple-200 text-sm">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                    {member.user_id !== team.owner_id && (
                      <Button
                        className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 hover:bg-red-500/30 transition-all duration-300 p-2 rounded-lg"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {team.invitations && team.invitations.length > 0 && (
          <div className="mt-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Pending Invitations</h2>
            <div className="space-y-3">
              {team.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{invitation.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(invitation.role)}`}>
                          {invitation.role}
                        </span>
                        <span className="text-purple-200 text-xs">
                          Expires {new Date(invitation.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 hover:bg-red-500/30 transition-all duration-300 p-2 rounded-lg"
                    title="Cancel invitation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
