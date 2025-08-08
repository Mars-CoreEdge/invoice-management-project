import { NextRequest, NextResponse } from 'next/server';
import { getTeamService } from '@/lib/team-service';
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server';
import { AcceptInvitationRequest } from '../../../../../types/teams';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    const { data: { user } } = await getAuthenticatedUser(request as any)
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: AcceptInvitationRequest = await request.json();
    
    if (!body.token || !body.token.trim()) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const teamService = getTeamService(supabase);
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