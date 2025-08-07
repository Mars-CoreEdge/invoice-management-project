import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/server-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check if user is a member of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', params.teamId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Get team members
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        user_id,
        role,
        joined_at,
        invited_by,
        auth.users (
          email,
          raw_user_meta_data
        )
      `)
      .eq('team_id', params.teamId);

    if (membersError) {
      console.error('Error fetching team members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    // Transform the data
    const transformedMembers = members?.map(member => ({
      team_id: params.teamId,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      invited_by: member.invited_by,
      email: member.auth?.users?.email,
      full_name: member.auth?.users?.raw_user_meta_data?.full_name
    })) || [];

    return NextResponse.json({ members: transformedMembers });
  } catch (error) {
    console.error('Error in GET /api/teams/[teamId]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check if user is admin of the team
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', params.teamId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('team_invitations')
      .insert({
        team_id: params.teamId,
        email,
        role,
        invited_by: userId,
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error in POST /api/teams/[teamId]/members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 