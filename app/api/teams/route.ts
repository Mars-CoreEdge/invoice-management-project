import { NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    
    // Get current user (supports Bearer Authorization too)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const teamService = getTeamService(supabase)
    const teams = await teamService.getUserTeams(user.id)

    return NextResponse.json({
      success: true,
      data: teams
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    
    // Get current user (supports Bearer Authorization too)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { team_name, description } = body

    if (!team_name || typeof team_name !== 'string' || team_name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      )
    }

    const teamService = getTeamService(supabase)
    const teamId = await teamService.createTeam({
      team_name: team_name.trim(),
      description: description?.trim()
    })

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Failed to create team' },
        { status: 500 }
      )
    }

    // Get the created team details
    const team = await teamService.getTeam(teamId)

    return NextResponse.json({
      success: true,
      data: { team_id: teamId, team }
    })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 