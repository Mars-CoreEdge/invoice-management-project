import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/server-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitation_token } = await request.json();
    
    if (!invitation_token) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', invitation_token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this team' }, { status: 400 });
    }

    // Add user to team
    const { data: newMember, error: addMemberError } = await supabase
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.invited_by
      })
      .select()
      .single();

    if (addMemberError) {
      console.error('Error adding member:', addMemberError);
      return NextResponse.json({ error: 'Failed to join team' }, { status: 500 });
    }

    // Delete the invitation
    const { error: deleteInvitationError } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitation.id);

    if (deleteInvitationError) {
      console.error('Error deleting invitation:', deleteInvitationError);
      // Don't fail the request if invitation deletion fails
    }

    return NextResponse.json({ 
      success: true,
      member: newMember
    });
  } catch (error) {
    console.error('Error in POST /api/teams/invitations/accept:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 