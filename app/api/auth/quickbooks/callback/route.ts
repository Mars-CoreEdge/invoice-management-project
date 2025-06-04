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
    
    console.log('OAuth Parameters:', {
      code: code ? `${code.substring(0, 20)}...` : null,
      realmId,
      state
    });
    
    if (!code || !realmId) {
      console.log('Missing required parameters');
      return NextResponse.json(
        { error: 'Missing authorization code or realm ID' },
        { status: 400 }
      );
    }
    
    if (state !== 'invoice-management-state') {
      console.log('Invalid state parameter:', state);
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }
    
    console.log('Getting QuickBooks service...');
    const qbs = getQuickBooksService();
    console.log('QuickBooks service obtained successfully');
    
    console.log('Creating token with QuickBooks...');
    await qbs.createToken(code, realmId);
    console.log('Token created successfully');
    
    console.log('Redirecting to dashboard with success');
    // Redirect to success page
    return NextResponse.redirect(new URL('/dashboard?connected=true', request.url));
  } catch (error: any) {

    console.log('Error:', error);

    // console.error('=== QuickBooks OAuth callback error ===');
    // console.error('Error name:', error.name);
    // console.error('Error message:', error.message);
    // console.error('Error stack:', error.stack);
    console.error('=====================================');
    return NextResponse.redirect(new URL('/dashboard?error=oauth_failed&message=' + encodeURIComponent(error.message), request.url));
  }
} 