'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { UserTeam, TeamRole } from '@/types/teams'

interface TeamContextType {
  // Current team state
  currentTeam: UserTeam | null
  currentRole: TeamRole | null
  userTeams: UserTeam[]
  
  // Loading states
  loading: boolean
  switching: boolean
  
  // Actions
  switchTeam: (teamId: string) => Promise<void>
  refreshTeams: () => Promise<void>
  
  // Utility
  isTeamOwner: boolean
  canManageTeam: boolean
  canInviteUsers: boolean
  canEditInvoices: boolean
  canDeleteInvoices: boolean
  canUseAITools: boolean
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const auth = useAuth() as any
  const user = auth?.user || null
  const isAuthenticated: boolean = !!auth?.isAuthenticated
  const [currentTeam, setCurrentTeam] = useState<UserTeam | null>(null)
  const [currentRole, setCurrentRole] = useState<TeamRole | null>(null)
  const [userTeams, setUserTeams] = useState<UserTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  // Avoid repeated calls by tracking last fetched user and in-flight state
  const lastFetchedUserIdRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  // Fetch user's teams
  const fetchUserTeams = useCallback(async () => {
    if (!user || isFetchingRef.current) return
    if (lastFetchedUserIdRef.current === user.id) return

    isFetchingRef.current = true
    setLoading(true)
    try {
      const response = await fetch('/api/teams', { cache: 'no-store' })
      const result = await response.json()
      
      if (result.success) {
        const teams: UserTeam[] = result.data
        setUserTeams(teams)
        lastFetchedUserIdRef.current = user.id
        
        // Set current team if none is selected or if current team is no longer accessible
        if (!currentTeam || !teams.find(t => t.team_id === currentTeam.team_id)) {
          if (teams.length > 0) {
            await switchTeam(teams[0].team_id)
          } else {
            setCurrentTeam(null)
            setCurrentRole(null)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user teams:', error)
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [user, currentTeam])

  // Switch to a different team
  const switchTeam = async (teamId: string) => {
    if (!user) return

    setSwitching(true)
    try {
      const team = userTeams.find(t => t.team_id === teamId)
      if (team) {
        setCurrentTeam(team)
        setCurrentRole(team.role)
        
        // Store in localStorage for persistence
        localStorage.setItem('currentTeamId', teamId)
      }
    } catch (error) {
      console.error('Error switching team:', error)
    } finally {
      setSwitching(false)
    }
  }

  // Refresh teams list
  const refreshTeams = useCallback(async () => {
    // force refresh by clearing last fetched id
    if (user) {
      lastFetchedUserIdRef.current = null
    }
    await fetchUserTeams()
  }, [user, fetchUserTeams])

  // Initialize team context when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserTeams()
    } else {
      lastFetchedUserIdRef.current = null
      isFetchingRef.current = false
      setCurrentTeam(null)
      setCurrentRole(null)
      setUserTeams([])
      setLoading(false)
    }
  }, [user, isAuthenticated, fetchUserTeams])

  // Restore current team from localStorage on mount
  useEffect(() => {
    if (userTeams.length > 0) {
      const savedTeamId = localStorage.getItem('currentTeamId')
      if (savedTeamId && userTeams.find(t => t.team_id === savedTeamId)) {
        switchTeam(savedTeamId)
      } else if (userTeams.length > 0) {
        switchTeam(userTeams[0].team_id)
      }
    }
  }, [userTeams])

  // Computed permissions based on current role
  const isTeamOwner = currentTeam?.is_owner || false
  const canManageTeam = currentRole === 'admin'
  const canInviteUsers = currentRole === 'admin'
  const canEditInvoices = currentRole === 'admin' || currentRole === 'accountant'
  const canDeleteInvoices = currentRole === 'admin'
  const canUseAITools = currentRole === 'admin' || currentRole === 'accountant' || currentRole === 'assistant'

  const value: TeamContextType = {
    currentTeam,
    currentRole,
    userTeams,
    loading,
    switching,
    switchTeam,
    refreshTeams,
    isTeamOwner,
    canManageTeam,
    canInviteUsers,
    canEditInvoices,
    canDeleteInvoices,
    canUseAITools,
  }

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = (): TeamContextType => {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}
