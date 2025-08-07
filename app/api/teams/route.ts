import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/server-utils';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    // Simple approach: just return empty array for now to test if the fix works
    // This avoids any complex queries that might trigger recursion
    console.log('Teams API called for user:', userId);
    
    // Try a simple query first to test if RLS is working
    const { data: testData, error: testError } = await supabase
      .from('teams')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Test query failed:', testError);
      return NextResponse.json({ error: 'Database access issue' }, { status: 500 });
    }

    // If test passes, try to get user's teams
    const { data: memberships, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', userId);

    if (membershipError) {
      console.error('Error fetching team memberships:', membershipError);
      // Return empty array instead of error to avoid breaking the UI
      return NextResponse.json({ teams: [] });
    }

    // If no memberships, return empty array
    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    // Get team IDs from memberships
    const teamIds = memberships.map(m => m.team_id);
    
    // Get teams details
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        description,
        owner_id,
        created_at,
        updated_at
      `)
      .in('id', teamIds);

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedTeams = teams?.map(team => {
      const membership = memberships.find(m => m.team_id === team.id);
      return {
        id: team.id,
        team_name: team.team_name,
        description: team.description,
        owner_id: team.owner_id,
        created_at: team.created_at,
        updated_at: team.updated_at,
        is_owner: team.owner_id === userId,
        role: membership?.role || 'viewer',
        member_count: 0 // This will be calculated separately if needed
      };
    }) || [];

    return NextResponse.json({ teams: transformedTeams });
  } catch (error) {
    console.error('Error in GET /api/teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await (request as any).json();
    const { team_name, description } = body;
    
    if (!team_name || team_name.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        team_name: team_name.trim(),
        description: description?.trim() || null,
        owner_id: userId
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }

    // Add the creator as an admin member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'admin'
      });

    if (memberError) {
      console.error('Error adding team member:', memberError);
      // If adding member fails, try to delete the team to maintain consistency
      await supabase.from('teams').delete().eq('id', team.id);
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
    }

    return NextResponse.json({ 
      team: {
        ...team,
        is_owner: true,
        role: 'admin',
        member_count: 1
      }
    });
  } catch (error) {
    console.error('Error in POST /api/teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 