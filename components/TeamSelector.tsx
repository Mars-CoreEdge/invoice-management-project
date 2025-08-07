'use client';

import React, { useState } from 'react';
import { ChevronDown, Users, Crown, Shield, Eye } from 'lucide-react';
import { useTeam } from './TeamContext';

interface Team {
  id: string;
  team_name: string;
  role: 'admin' | 'accountant' | 'viewer';
  is_owner: boolean;
  member_count: number;
}

export default function TeamSelector() {
  const { selectedTeamId, setSelectedTeamId, teams, loading } = useTeam();
  const [isOpen, setIsOpen] = useState(false);

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

  const selectedTeam = teams.find(team => team.id === selectedTeamId);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
        <span className="text-sm text-purple-200">Loading teams...</span>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg">
        <Users className="w-4 h-4 text-purple-300" />
        <span className="text-sm text-purple-200">No teams available</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-w-[200px] transition-all duration-200"
      >
        <div className="flex items-center space-x-2 flex-1">
          <Users className="w-4 h-4 text-purple-300" />
          <span className="text-sm font-medium text-white truncate">
            {selectedTeam?.team_name || 'Select Team'}
          </span>
        </div>
        {selectedTeam && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(selectedTeam.role)}`}>
            {getRoleIcon(selectedTeam.role)}
            <span className="ml-1 capitalize">{selectedTeam.role}</span>
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => {
                setSelectedTeamId(team.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 transition-colors ${
                selectedTeamId === team.id ? 'bg-purple-500/20 border-l-2 border-purple-400' : ''
              }`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Users className="w-4 h-4 text-purple-300 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{team.team_name}</p>
                  <p className="text-xs text-purple-200">{team.member_count} members</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {team.is_owner && <Crown className="w-3 h-3 text-yellow-400" />}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(team.role)}`}>
                  {getRoleIcon(team.role)}
                  <span className="ml-1 capitalize">{team.role}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 