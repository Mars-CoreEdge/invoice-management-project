import { NextResponse } from 'next/server';
import { getQBOSessionManager } from '@/lib/qbo-session';
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Extract query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get the current authenticated user
    const supabase = await createSupabaseForRequest(request as any);
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any);
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Please log in to access items'
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

    // Fetch items using the QBO session manager
    const result = await qboSessionManager.getItems(session, limit, offset);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch items'
      }, { status: 500 });
    }

    // Transform QuickBooks item data
    const transformedItems = (result.data || []).map((item: any) => ({
      id: item.Id,
      name: item.Name,
      description: item.Description,
      type: item.Type,
      unitPrice: item.UnitPrice,
      purchaseCost: item.PurchaseCost,
      incomeAccountRef: item.IncomeAccountRef,
      expenseAccountRef: item.ExpenseAccountRef,
      active: item.Active !== false,
      taxable: item.Taxable,
      trackQtyOnHand: item.TrackQtyOnHand,
      qtyOnHand: item.QtyOnHand
    }));

    return NextResponse.json({
      success: true,
      data: transformedItems,
      count: transformedItems.length,
      hasMore: transformedItems.length === limit
    });

  } catch (error: any) {
    console.error('Error fetching items:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch items'
    }, { 
      status: 500 
    });
  }
} 