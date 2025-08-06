import { NextResponse } from 'next/server';
import { getQuickBooksService } from '@/lib/quickbooks';
import { getQuickBooksTokenManager } from '@/lib/quickbooks-token-manager';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    // console.log('=== QuickBooks OAuth Callback Started ===');
    // console.log('Request URL:', request.url);
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const code = searchParams.get('code');
    const realmId = searchParams.get('realmId');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // console.log('OAuth Parameters:', {
    //   code: code ? `${code.substring(0, 20)}...` : 'null',
    //   realmId,
    //   state,
    //   error,
    //   errorDescription
    // });
    
    // Handle OAuth errors (user declined, access denied, etc.)
    if (error) {
      // console.log('OAuth error received:', error, errorDescription);
      
      let errorMessage = 'Authorization was declined or failed.';
      if (error === 'access_denied') {
        errorMessage = 'QuickBooks authorization was declined. Please try connecting again.';
      } else if (errorDescription) {
        errorMessage = errorDescription;
      }
      
      // Redirect to dashboard with a user-friendly error message
      return NextResponse.redirect(
        new URL(`/dashboard?error=auth_declined&message=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }
    
    // Handle missing required parameters (but no explicit error)
    if (!code || !realmId) {
      // console.log('Missing required parameters - user may have declined authorization');
      // console.log('Code present:', !!code);
      // console.log('RealmId present:', !!realmId);
      return NextResponse.redirect(
        new URL('/dashboard?error=auth_declined&message=' + encodeURIComponent('Authorization was not completed. Please try connecting again.'), request.url)
      );
    }
    
    // Validate state parameter
    if (state !== 'invoice-management-state') {
      // console.log('Invalid state parameter:', state);
      // console.log('Expected state: invoice-management-state');
      return NextResponse.redirect(
        new URL('/dashboard?error=auth_failed&message=' + encodeURIComponent('Invalid authorization state. Please try connecting again.'), request.url)
      );
    }
    
    // Get the current authenticated user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // console.error('Authentication error:', authError);
      return NextResponse.redirect(
        new URL('/auth/login?error=unauthorized&message=' + encodeURIComponent('Please log in to connect QuickBooks'), request.url)
      );
    }
    
    // console.log('Authenticated user:', user.id);
    
    // console.log('Getting QuickBooks service...');
    const qbs = getQuickBooksService();
    // console.log('QuickBooks service obtained successfully');
    
    // console.log('Creating token with QuickBooks...');
    
    // Create token with QuickBooks (no retry - authorization codes can only be used once)
    try {
      await qbs.createToken(code, realmId, user.id);
      // console.log('Token created and stored securely');
    } catch (error: any) {
      // console.error('Token creation failed:', error);
      throw error;
    }
    
    // console.log('Redirecting to dashboard with success');
    return NextResponse.redirect(
      new URL('/dashboard?connected=true&refresh=true', request.url)
    );
    
  } catch (error: any) {
    // console.log('Error:', error);
    // console.error('=== QuickBooks OAuth callback error ===');
    // console.error('Error name:', error.name);
    // console.error('Error message:', error.message);
    // console.error('Error stack:', error.stack);
    // console.error('=====================================');
    
    return NextResponse.redirect(
      new URL('/dashboard?error=oauth_failed&message=' + encodeURIComponent(error.message), request.url)
    );
  }
} 