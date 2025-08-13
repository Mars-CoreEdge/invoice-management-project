import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
} 

/**
 * Helper to retrieve the authenticated user from a request.
 * Falls back to cookie-based session, but also supports Bearer tokens via Authorization header.
 */
export async function getAuthenticatedUser(request: NextRequest | Request) {
  const supabase = createServerSupabaseClient()
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined

  if (bearer) {
    // Validate via provided access token
    return await supabase.auth.getUser(bearer)
  }

  // Default: validate via cookie session
  return await supabase.auth.getUser()
}

/**
 * Creates a Supabase client for this request and seeds it with
 * the access/refresh tokens from either cookies or Authorization header
 * so subsequent queries run under the authenticated context (RLS).
 */
export async function createSupabaseForRequest(request: NextRequest | Request) {
  const supabase = createServerSupabaseClient()
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    const bearer = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined
    const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie') || ''
    const refresh = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.toLowerCase().startsWith('sb-refresh-token='))
      ?.split('=')[1]

    if (bearer && refresh) {
      await supabase.auth.setSession({ access_token: bearer, refresh_token: refresh })
    }
  } catch {}
  return supabase
}