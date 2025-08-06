import { NextRequest, NextResponse } from 'next/server';
import { getTeamService } from '../../../../../lib/team-service';
import { getUserIdFromRequest } from '../../../../../lib/utils';
import { AcceptInvitationRequest } from '../../../../../types/teams';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AcceptInvitationRequest = await request.json();
    
    if (!body.token || !body.token.trim()) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const teamService = getTeamService();
    const teamId = await teamService.acceptInvitation(body);

    if (!teamId) {
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      team_id: teamId,
      message: 'Invitation accepted successfully' 
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
} 