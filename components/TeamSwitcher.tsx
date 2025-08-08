'use client'

import { useState } from 'react'
import { useTeam } from './TeamContext'
import { ChevronDown, Users, Plus } from 'lucide-react'
import Link from 'next/link'

export function TeamSwitcher() {
  const { currentTeam, userTeams, switching, switchTeam } = useTeam()
  const [isOpen, setIsOpen] = useState(false)

  if (!currentTeam) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-medium">No Team</span>
      </div>
    )
  }

  const handleTeamSwitch = async (teamId: string) => {
    await switchTeam(teamId)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-white hover:bg-white/20 transition-all duration-300 min-w-0"
      >
        <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Users className="w-3 h-3 text-white" />
        </div>
        <span className="font-medium truncate max-w-32">
          {currentTeam.team_name}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50">
          <div className="p-2">
            {/* Current Team */}
            <div className="px-3 py-2 text-sm text-purple-200 border-b border-white/10">
              Current Team
            </div>
            
            {/* Team List */}
            <div className="max-h-48 overflow-y-auto">
              {userTeams.map((team) => (
                <button
                  key={team.team_id}
                  onClick={() => handleTeamSwitch(team.team_id)}
                  disabled={switching}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    team.team_id === currentTeam.team_id
                      ? 'bg-purple-600/30 text-white'
                      : 'text-purple-100 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center flex-shrink-0">
                        <Users className="w-2 h-2 text-white" />
                      </div>
                      <span className="truncate">{team.team_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        team.role === 'admin' 
                          ? 'bg-purple-600/30 text-purple-200' 
                          : team.role === 'accountant'
                          ? 'bg-blue-600/30 text-blue-200'
                          : 'bg-gray-600/30 text-gray-200'
                      }`}>
                        {team.role}
                      </span>
                      {team.is_owner && (
                        <span className="text-xs bg-yellow-600/30 text-yellow-200 px-1 py-1 rounded">
                          Owner
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Create New Team */}
            <div className="border-t border-white/10 pt-2 mt-2">
              <Link
                href="/teams/new"
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-purple-200 hover:bg-white/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Team
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
