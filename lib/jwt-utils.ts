import { createClient } from './supabase'
import type { Session } from '@supabase/supabase-js'

export interface JWTPayload {
  aud: string
  exp: number
  sub: string
  email: string
  phone: string
  app_metadata: {
    provider: string
    providers: string[]
  }
  user_metadata: Record<string, any>
  role: string
  aal: string
  amr: Array<{ method: string; timestamp: number }>
  session_id: string
}

/**
 * Decode JWT token without verification (for client-side use)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload) return true
  
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Get time until token expires (in seconds)
 */
export function getTimeUntilExpiry(token: string): number {
  const payload = decodeJWT(token)
  if (!payload) return 0
  
  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, payload.exp - now)
}

/**
 * Check if token needs refresh (expires in next 5 minutes)
 */
export function needsRefresh(token: string): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(token)
  return timeUntilExpiry < 300 // 5 minutes
}

/**
 * Get user info from JWT token
 */
export function getUserFromToken(token: string): { id: string; email: string } | null {
  const payload = decodeJWT(token)
  if (!payload) return null
  
  return {
    id: payload.sub,
    email: payload.email
  }
}

/**
 * Validate session and refresh if needed
 */
export async function validateAndRefreshSession(): Promise<Session | null> {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    
    if (!session) {
      return null
    }
    
    // Check if access token needs refresh
    if (needsRefresh(session.access_token)) {
      console.log('Access token needs refresh, refreshing session...')
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError)
        return null
      }
      
      return data.session
    }
    
    return session
  } catch (error) {
    console.error('Error validating session:', error)
    return null
  }
}

/**
 * Get authorization header with JWT token
 */
export async function getAuthHeader(): Promise<{ Authorization: string } | null> {
  const session = await validateAndRefreshSession()
  
  if (!session) {
    return null
  }
  
  return {
    Authorization: `Bearer ${session.access_token}`
  }
}

/**
 * Make authenticated API request with automatic token refresh
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeader = await getAuthHeader()
  
  if (!authHeader) {
    throw new Error('No valid session found')
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...authHeader,
      'Content-Type': 'application/json',
    },
  })
  
  // If we get a 401, try to refresh the session and retry once
  if (response.status === 401) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()
    
    if (!error && data.session) {
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      return retryResponse
    }
  }
  
  return response
} 