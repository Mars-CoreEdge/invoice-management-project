'use client'

import { useState, useEffect } from 'react'
import { useTeam } from '@/components/TeamContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users, 
  Plus, 
  Settings, 
  UserPlus, 
  Crown,
  Shield,
  Eye
} from 'lucide-react'
import { UserTeam } from '@/types/teams'

export default function TeamsPage() {
  const { userTeams, loading, refreshTeams } = useTeam()
  const [teams, setTeams] = useState<UserTeam[]>([])

  useEffect(() => {
    setTeams(userTeams)
  }, [userTeams])

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
          <div className="text-white text-xl">Loading teams...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Teams</h1>
              <p className="text-purple-200">
                Manage your teams and collaborate with your colleagues
              </p>
            </div>
            <Link href="/teams/new">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0">
                <Plus className="w-5 h-5 mr-2" />
                Create Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Teams Yet</h2>
            <p className="text-purple-200 mb-8 max-w-md mx-auto">
              Create your first team to start collaborating with your colleagues on invoice management.
            </p>
            <Link href="/teams/new">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Team
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team.team_id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
              >
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{team.team_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleIcon(team.role)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(team.role)}`}>
                          {team.role}
                        </span>
                        {team.is_owner && (
                          <span className="text-xs bg-yellow-600/30 text-yellow-200 px-2 py-1 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-200">Members</span>
                    <span className="text-white font-medium">{team.member_count}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/teams/${team.team_id}`}
                    className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 py-2 px-4 rounded-xl text-sm font-medium text-center"
                  >
                    Manage
                  </Link>
                  {(team.role === 'admin' || team.is_owner) && (
                    <Link
                      href={`/teams/${team.team_id}/invite`}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transition-all duration-300 py-2 px-4 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
