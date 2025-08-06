import { NextRequest, NextResponse } from 'next/server';
import { getTeamService } from '../../../../lib/team-service';
import { getUserIdFromRequest } from '../../../../lib/utils';
import { Team } from '../../../../types/teams';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamService = getTeamService();
    
    // Check if user has access to this team
    const hasAccess = await teamService.checkUserRole(userId, params.teamId);
    if (!hasAccess.is_member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const team = await teamService.getTeam(params.teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Error getting team:', error);
    return NextResponse.json(
      { error: 'Failed to get team' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamService = getTeamService();
    
    // Check if user is admin of this team
    const hasPermission = await teamService.checkUserPermission(
      userId, 
      params.teamId, 
      'can_manage_team'
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body: Partial<Pick<Team, 'team_name' | 'description'>> = await request.json();
    
    if (body.team_name !== undefined && body.team_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name cannot be empty' },
        { status: 400 }
      );
    }

    const success = await teamService.updateTeam(params.teamId, body);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update team' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Team updated successfully' 
    });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamService = getTeamService();
    
    // Check if user is the team owner
    const isOwner = await teamService.isTeamOwner(userId, params.teamId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Only team owner can delete team' }, { status: 403 });
    }

    const success = await teamService.deleteTeam(params.teamId);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete team' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Team deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
} 