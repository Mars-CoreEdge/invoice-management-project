import { NextRequest, NextResponse } from 'next/server';
import { getTeamService } from '../../../lib/team-service';
import { getUserIdFromRequest } from '../../../lib/utils';
import { CreateTeamRequest } from '../../../types/teams';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamService = getTeamService();
    const teams = await teamService.getUserTeams(userId);

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error getting user teams:', error);
    return NextResponse.json(
      { error: 'Failed to get teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTeamRequest = await request.json();
    
    if (!body.team_name || body.team_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const teamService = getTeamService();
    const teamId = await teamService.createTeam(body);

    if (!teamId) {
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      team_id: teamId,
      message: 'Team created successfully' 
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
} 