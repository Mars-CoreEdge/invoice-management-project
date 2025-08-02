'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  // User state
  user: User | null
  session: Session | null
  loading: boolean
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error: AuthError | null }>
  
  // Session management
  refreshSession: () => Promise<void>
  
  // Utility methods
  isAuthenticated: boolean
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is authenticated
  const isAuthenticated = !!user && !!session

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
              router.push('/dashboard')
            }
            break
          case 'SIGNED_OUT':
            setUser(null)
            setSession(null)
            router.push('/auth/login')
            break
          case 'TOKEN_REFRESHED':
            setUser(session?.user ?? null)
            setSession(session)
            break
          case 'USER_UPDATED':
            setUser(session?.user ?? null)
            setSession(session)
            break
          default:
            setUser(session?.user ?? null)
            setSession(session)
        }
        setLoading(false)
      }
    )

    // Set up automatic token refresh
    const refreshInterval = setInterval(async () => {
      if (session) {
        const expiresAt = session.expires_at
        const now = Math.floor(Date.now() / 1000)
        
        // Refresh token if it expires in the next 5 minutes
        if (expiresAt && (expiresAt - now) < 300) {
          console.log('Token expiring soon, refreshing...')
          await refreshSession()
        }
      }
    }, 60000) // Check every minute

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [supabase.auth, session, router])

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: error as AuthError }
    }
  }

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      
      return { error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error: error as AuthError }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Sign in with OAuth
  const signInWithOAuth = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      
      return { error }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      return { error: error as AuthError }
    }
  }

  // Refresh session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Error refreshing session:', error)
        setUser(null)
        setSession(null)
      } else if (data.session) {
        setUser(data.session.user)
        setSession(data.session)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      setUser(null)
      setSession(null)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    refreshSession,
    isAuthenticated,
    isInitialized,
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