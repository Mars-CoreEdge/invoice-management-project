'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Team {
  id: string;
  team_name: string;
  role: 'admin' | 'accountant' | 'viewer';
  is_owner: boolean;
  member_count: number;
}

interface TeamContextType {
  selectedTeamId: string | undefined;
  setSelectedTeamId: (teamId: string | undefined) => void;
  teams: Team[];
  loading: boolean;
  refreshTeams: () => void;
  userRole: 'admin' | 'accountant' | 'viewer' | null;
  canInviteUsers: boolean;
  canManageTeam: boolean;
  canViewInvoices: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
        
        // Auto-select first team if none selected
        if (!selectedTeamId && data.teams?.length > 0) {
          setSelectedTeamId(data.teams[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const selectedTeam = teams.find(team => team.id === selectedTeamId);
  const userRole = selectedTeam?.role || null;

  // Permission checks based on user role
  const canInviteUsers = userRole === 'admin';
  const canManageTeam = userRole === 'admin';
  const canViewInvoices = ['admin', 'accountant', 'viewer'].includes(userRole || '');

  const value: TeamContextType = {
    selectedTeamId,
    setSelectedTeamId,
    teams,
    loading,
    refreshTeams: fetchTeams,
    userRole,
    canInviteUsers,
    canManageTeam,
    canViewInvoices,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
} 