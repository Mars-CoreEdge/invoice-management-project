import { NextResponse } from 'next/server';
import { getQBOSessionManager } from '@/lib/qbo-session';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Extract query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get the current authenticated user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Please log in to access customers'
      }, { status: 401 });
    }

    const qboSessionManager = getQBOSessionManager();
    
    // Get QBO session for the current user
    const session = await qboSessionManager.getSession(user.id);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'QuickBooks connection required',
        details: 'Please connect your QuickBooks account first'
      }, { status: 401 });
    }

    // Fetch customers using the QBO session manager
    const result = await qboSessionManager.getCustomers(session, limit, offset);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch customers'
      }, { status: 500 });
    }

    // Transform QuickBooks customer data
    const transformedCustomers = (result.data || []).map((customer: any) => ({
      id: customer.Id,
      name: customer.DisplayName || customer.CompanyName || 'Unknown Customer',
      companyName: customer.CompanyName,
      email: customer.PrimaryEmailAddr?.Address,
      phone: customer.PrimaryPhone?.FreeFormNumber,
      address: customer.BillAddr ? {
        line1: customer.BillAddr.Line1,
        line2: customer.BillAddr.Line2,
        city: customer.BillAddr.City,
        state: customer.BillAddr.CountrySubDivisionCode,
        postalCode: customer.BillAddr.PostalCode,
        country: customer.BillAddr.Country
      } : null,
      active: customer.Active !== false
    }));

    return NextResponse.json({
      success: true,
      data: transformedCustomers,
      count: transformedCustomers.length,
      hasMore: transformedCustomers.length === limit
    });

  } catch (error: any) {
    console.error('Error fetching customers:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch customers'
    }, { 
      status: 500 
    });
  }
} 