import { NextResponse } from 'next/server';
import { getQuickBooksService } from '@/lib/quickbooks';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    // Get the current authenticated user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Please log in to check QuickBooks status'
      }, { status: 401 });
    }

    const qbs = getQuickBooksService();
    
    // Try to load tokens for the current user
    const tokensLoaded = await qbs.loadTokensForUser(user.id);
    
    const status = {
      isAuthenticated: qbs.isAuthenticated(),
      hasAccessToken: !!qbs.getAccessToken(),
      hasRealmId: !!qbs.getRealmId(),
      accessTokenPreview: qbs.getAccessToken() ? `${qbs.getAccessToken()!.substring(0, 20)}...` : null,
      realmId: qbs.getRealmId(),
      userId: user.id,
      tokensLoaded,
      timestamp: new Date().toISOString()
    };
    
    console.log('QuickBooks status check:', status);
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error: any) {
    console.error('Error checking QuickBooks status:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { 
      status: 500 
    });
  }
} 