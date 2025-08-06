import { NextResponse } from 'next/server';
import { getQuickBooksService } from '@/lib/quickbooks';

export async function GET(request: Request) {
  try {
    console.log('QuickBooks OAuth initiation requested');
    console.log('Using Express server credentials');

    console.log('Creating QuickBooks service...');
    const qbs = getQuickBooksService();
    console.log('Getting auth URI...');
    const authUri = qbs.getAuthUri();
    
    console.log('Redirecting to QuickBooks OAuth:', authUri);
    return NextResponse.redirect(authUri);
  } catch (error: any) {
    console.error('QuickBooks OAuth error:', error);
    
    return NextResponse.redirect(
      new URL(`/dashboard?error=oauth_failed&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
} 