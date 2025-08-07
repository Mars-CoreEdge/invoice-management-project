'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  // User state
  user: User | null
  session: Session | null
  loading: boolean
  profile: Profile | null
  profileLoading: boolean
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error: AuthError | null }>
  
  // Session management
  refreshSession: () => Promise<void>
  
  // Profile management
  refreshProfile: () => Promise<void>
  
  // Utility methods
  isAuthenticated: boolean
  isInitialized: boolean
  hasCompletedProfile: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Check if user is authenticated
  const isAuthenticated = !!user && !!session

  // Check if user has completed profile setup
  const hasCompletedProfile = !!profile?.full_name

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      setProfileLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  // Check if user needs to complete profile setup
  useEffect(() => {
    if (isAuthenticated && !profileLoading && !hasCompletedProfile) {
      // Don't redirect if already on profile setup page or auth pages
      const authPages = ['/auth/login', '/auth/signup', '/auth/callback']
      const isAuthPage = authPages.some(page => pathname?.startsWith(page))
      
      if (!isAuthPage && pathname !== '/profile-setup') {
        router.push('/profile-setup')
      }
    }
  }, [isAuthenticated, profileLoading, hasCompletedProfile, pathname, router])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          setUser(null)
          setSession(null)
        } else {
          setUser(session?.user ?? null)
          setSession(session)
          
          // Fetch profile if user is authenticated
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
        setSession(null)
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        switch (event) {
          case 'SIGNED_IN':
            setUser(session?.user ?? null)
            setSession(session)
            if (session?.user) {
              await fetchProfile(session.user.id)
              // Don't auto-redirect here, let the profile check handle it
            }
            break
          case 'SIGNED_OUT':
            setUser(null)
            setSession(null)
            setProfile(null)
            router.push('/auth/login')
            break
          case 'TOKEN_REFRESHED':
            setUser(session?.user ?? null)
            setSession(session)
            if (session?.user) {
              await fetchProfile(session.user.id)
            }
            break
          case 'USER_UPDATED':
            setUser(session?.user ?? null)
            setSession(session)
            if (session?.user) {
              await fetchProfile(session.user.id)
            }
            break
          default:
            setUser(session?.user ?? null)
            setSession(session)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: error as AuthError }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const signInWithOAuth = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      return { error: error as AuthError }
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Error refreshing session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    profile,
    profileLoading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    refreshSession,
    refreshProfile,
    isAuthenticated,
    isInitialized,
    hasCompletedProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 