import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams (
          id,
          team_name
        )
      `)
      .eq('token', params.token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    return NextResponse.json({ 
      invitation: {
        id: invitation.id,
        team_id: invitation.team_id,
        email: invitation.email,
        role: invitation.role,
        team_name: invitation.teams.team_name,
        invited_by: invitation.invited_by,
        expires_at: invitation.expires_at
      }
    });
  } catch (error) {
    console.error('Error in GET /api/teams/invitations/[token]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 