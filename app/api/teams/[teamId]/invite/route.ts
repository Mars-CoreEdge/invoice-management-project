import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'

export async function POST(
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
    const { email, role = 'viewer' } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    const teamService = getTeamService(supabase)

    // Check if user is admin of this team
    const roleCheck = await teamService.checkUserRole(user.id, teamId, ['admin'])
    if (!roleCheck.has_permission) {
      return NextResponse.json(
        { success: false, error: 'Admin access required to invite members' },
        { status: 403 }
      )
    }

    // Send invitation
    const invitationToken = await teamService.inviteUser({
      team_id: teamId,
      email: email.trim().toLowerCase(),
      role
    })

    if (!invitationToken) {
      return NextResponse.json(
        { success: false, error: 'Failed to send invitation' },
        { status: 500 }
      )
    }

    // TODO: Send email invitation (implement email service)
    // For now, we'll just return success
    console.log(`Invitation sent to ${email} for team ${teamId} with token: ${invitationToken}`)

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      data: { invitationToken }
    })
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
