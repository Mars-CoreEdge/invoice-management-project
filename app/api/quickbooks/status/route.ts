import { NextResponse } from 'next/server';
import { getQuickBooksService } from '@/lib/quickbooks';
import { getQuickBooksTokenManager } from '@/lib/quickbooks-token-manager';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    // Get the current authenticated user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Please log in to check QuickBooks status'
      }, { status: 401 });
    }

    const tokenManager = getQuickBooksTokenManager();
    const hasValidTokens = await tokenManager.hasValidTokens(user.id);
    
    if (!hasValidTokens) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'QuickBooks not connected'
      });
    }

    // Try to load tokens and verify they work
    const qbs = getQuickBooksService();
    const tokensLoaded = await qbs.loadTokensForUser(user.id);
    
    if (!tokensLoaded) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'QuickBooks connection expired or invalid'
      });
    }

    // Try to get company info to verify the connection works
    try {
      const companyInfo = await qbs.getCompanyInfo();
      return NextResponse.json({
        success: true,
        connected: true,
        companyName: companyInfo.CompanyName,
        realmId: qbs.getRealmId(),
        message: 'QuickBooks connected successfully'
      });
    } catch (apiError) {
      console.error('Error verifying QuickBooks connection:', apiError);
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'QuickBooks connection verification failed'
      });
    }

  } catch (error: any) {
    console.error('Error checking QuickBooks status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check QuickBooks status',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the current authenticated user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Please log in to disconnect QuickBooks'
      }, { status: 401 });
    }

    const qbs = getQuickBooksService();
    await qbs.disconnectUser(user.id);
    
    return NextResponse.json({
      success: true,
      message: 'QuickBooks disconnected successfully'
    });

  } catch (error: any) {
    console.error('Error disconnecting QuickBooks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to disconnect QuickBooks',
      details: error.message
    }, { status: 500 });
  }
} 