import { NextRequest, NextResponse } from 'next/server';
import { getTeamService } from '../../../../../lib/team-service';
import { createSupabaseForRequest, getAuthenticatedUser } from '../../../../../lib/supabase-server';
import { InviteUserRequest } from '../../../../../types/teams';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = await createSupabaseForRequest(request);
    const { data: { user } } = await getAuthenticatedUser(request);
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamService = getTeamService(supabase);
    
    // Check if user has access to this team
    const hasAccess = await teamService.checkUserRole(userId, params.teamId);
    if (!hasAccess.is_member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const members = await teamService.getTeamMembers(params.teamId);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error getting team members:', error);
    return NextResponse.json(
      { error: 'Failed to get team members' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = await createSupabaseForRequest(request);
    const { data: { user } } = await getAuthenticatedUser(request);
    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamService = getTeamService(supabase);
    
    // Check if user can invite others
    const hasPermission = await teamService.checkUserPermission(
      userId, 
      params.teamId, 
      'can_invite_users'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: InviteUserRequest = await request.json();
    
    if (!body.email || !body.email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (body.role && !['admin', 'accountant', 'viewer', 'assistant'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const invitationToken = await teamService.inviteUser({
      team_id: params.teamId,
      email: body.email,
      role: body.role
    });

    if (!invitationToken) {
      return NextResponse.json(
        { error: 'Failed to invite user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      invitation_token: invitationToken,
      message: 'User invited successfully' 
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
} 