import { NextResponse } from 'next/server';
import { getQuickBooksService } from '@/lib/quickbooks';

export async function GET(request: Request) {
  try {
    const qbs = getQuickBooksService();
    
    const status = {
      isAuthenticated: qbs.isAuthenticated(),
      hasAccessToken: !!qbs.getAccessToken(),
      hasRealmId: !!qbs.getRealmId(),
      accessTokenPreview: qbs.getAccessToken() ? `${qbs.getAccessToken()!.substring(0, 20)}...` : null,
      realmId: qbs.getRealmId(),
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