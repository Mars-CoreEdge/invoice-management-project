import { NextResponse } from 'next/server';
import { getQuickBooksService } from '@/lib/quickbooks';

export async function GET(request: Request) {
  try {
    console.log('=== OAuth URL Test ===');
    
    const qbs = getQuickBooksService();
    const authUri = qbs.getAuthUri();
    
    console.log('Generated OAuth URI:', authUri);
    console.log('URI Components:');
    const url = new URL(authUri);
    console.log('- Base URL:', url.origin + url.pathname);
    console.log('- Client ID:', url.searchParams.get('client_id'));
    console.log('- Redirect URI:', url.searchParams.get('redirect_uri'));
    console.log('- Scope:', url.searchParams.get('scope'));
    console.log('- State:', url.searchParams.get('state'));
    
    return NextResponse.json({
      success: true,
      authUri,
      components: {
        clientId: url.searchParams.get('client_id'),
        redirectUri: url.searchParams.get('redirect_uri'),
        scope: url.searchParams.get('scope'),
        state: url.searchParams.get('state')
      }
    });
  } catch (error: any) {
    console.error('OAuth URL test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
} 