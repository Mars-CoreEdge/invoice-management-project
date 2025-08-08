import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = await createSupabaseForRequest(request)
    
    // Get current user
    const { data: { user }, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { teamId } = params
    const teamService = getTeamService(supabase)

    // Check if user has access to this team
    const roleCheck = await teamService.checkUserRole(user.id, teamId)
    if (!roleCheck.is_member) {
      return NextResponse.json(
        { success: false, error: 'Team not found or access denied' },
        { status: 404 }
      )
    }

    // Get team details
    const team = await teamService.getTeam(teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      )
    }

    // Get team members
    const members = await teamService.getTeamMembers(teamId)
    
    // Get pending invitations
    const invitations = await teamService.getTeamInvitations(teamId)

    return NextResponse.json({
      success: true,
      data: {
        ...team,
        members,
        invitations
      }
    })
  } catch (error) {
    console.error('Error fetching team details:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = await createSupabaseForRequest(request)
    
    // Get current user
    const { data: { user }, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { teamId } = params
    const body = await request.json()
    const { team_name, description } = body

    const teamService = getTeamService(supabase)

    // Check if user is admin of this team
    const roleCheck = await teamService.checkUserRole(user.id, teamId, ['admin'])
    if (!roleCheck.has_permission) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Update team
    const success = await teamService.updateTeam(teamId, {
      team_name: team_name?.trim(),
      description: description?.trim()
    })

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update team' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Team updated successfully'
    })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = await createSupabaseForRequest(request)
    
    // Get current user
    const { data: { user }, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { teamId } = params
    const teamService = getTeamService(supabase)

    // Check if user is the team owner
    const isOwner = await teamService.isTeamOwner(user.id, teamId)
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only team owner can delete the team' },
        { status: 403 }
      )
    }

    // Delete team
    const success = await teamService.deleteTeam(teamId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete team' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 