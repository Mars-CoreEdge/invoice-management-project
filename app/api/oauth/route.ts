import { NextResponse } from 'next/server';
import { getQuickBooksService } from '@/lib/quickbooks';

export async function GET(request: Request) {
  try {
    console.log('=== QuickBooks OAuth Callback Started ===');
    console.log('Request URL:', request.url);
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const code = searchParams.get('code');
    const realmId = searchParams.get('realmId');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    console.log('OAuth Parameters:', {
      code: code ? `${code.substring(0, 20)}...` : 'null',
      realmId,
      state,
      error,
      errorDescription
    });
    
    // Handle OAuth errors (user declined, access denied, etc.)
    if (error) {
      console.log('OAuth error received:', error, errorDescription);
      
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
      console.log('Missing required parameters - user may have declined authorization');
      console.log('Code present:', !!code);
      console.log('RealmId present:', !!realmId);
      return NextResponse.redirect(
        new URL('/dashboard?error=auth_declined&message=' + encodeURIComponent('Authorization was not completed. Please try connecting again.'), request.url)
      );
    }
    
    // Validate state parameter
    if (state !== 'invoice-management-state') {
      console.log('Invalid state parameter:', state);
      console.log('Expected state: invoice-management-state');
      return NextResponse.redirect(
        new URL('/dashboard?error=auth_failed&message=' + encodeURIComponent('Invalid authorization state. Please try connecting again.'), request.url)
      );
    }
    
    console.log('Getting QuickBooks service...');
    const qbs = getQuickBooksService();
    console.log('QuickBooks service obtained successfully');
    
    console.log('Creating token with QuickBooks...');
    await qbs.createToken(code, realmId);
    console.log('Token created successfully');
    
    // Get the QBO session object
    const qboSession = qbs.getQBOSession();
    if (!qboSession) {
      throw new Error('Failed to create QBO session object');
    }
    
    console.log('QBO Session created:', {
      realmId: qboSession.realmId,
      hasAccessToken: !!qboSession.access_token,
      hasRefreshToken: !!qboSession.refresh_token,
      clientId: qboSession.QUICKBOOKS_CLIENT_ID.substring(0, 8) + '...'
    });
    
    // Store the session data in localStorage via a redirect with query params
    // In a real app, you'd store this in a database or secure session
    const sessionData = encodeURIComponent(JSON.stringify(qboSession));
    
    console.log('Redirecting to dashboard with success and session data');
    return NextResponse.redirect(
      new URL(`/dashboard?connected=true&session=${sessionData}`, request.url)
    );
    
  } catch (error: any) {
    console.log('Error:', error);
    console.error('=== QuickBooks OAuth callback error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=====================================');
    
    return NextResponse.redirect(
      new URL('/dashboard?error=oauth_failed&message=' + encodeURIComponent(error.message), request.url)
    );
  }
} 