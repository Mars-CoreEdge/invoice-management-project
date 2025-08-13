import { createSupabaseForRequest, getAuthenticatedUser, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    
    // Get the current user from cookie session or Authorization header
    const { data: { user }, error } = await getAuthenticatedUser(request as any)

    // Determine token source (session or Authorization header)
    const authHeader = (request.headers as any).get('authorization') || (request.headers as any).get('Authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || bearer

    if ((error || !user) && !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // You can decode the JWT to get user information
    // Note: In production, you should verify the JWT signature on the server side
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )
    
    return NextResponse.json({
      message: 'Protected data accessed successfully',
      user: {
        id: user.id,
        email: user.email,
        role: payload.role || 'user',
        sessionId: payload.session_id
      },
      tokenInfo: {
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        audience: payload.aud
      }
    })
    
  } catch (error) {
    console.error('Protected route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse the request body
    const body = await request.json()
    
    // Example: Store user-specific data
    const { data, error: insertError } = await supabase
      .from('user_data')
      .insert([
        {
          user_id: user.id,
          data: body.data,
          created_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save data' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      message: 'Data saved successfully',
      data: data[0]
    })
    
  } catch (error) {
    console.error('Protected POST route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 