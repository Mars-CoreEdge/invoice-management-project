import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user.id
  } catch (error) {
    console.error('Error getting user ID from request:', error)
    return null
  }
}
