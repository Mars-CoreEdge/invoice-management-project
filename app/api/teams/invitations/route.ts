import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invitations for teams where user is admin
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        teams!inner(
          id,
          team_name,
          owner_id
        )
      `)
      .eq('teams.owner_id', user.id);

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Error in invitations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 