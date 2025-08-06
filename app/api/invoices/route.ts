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
        details: 'Please log in to access invoices',
        requiresAuth: true
      }, { status: 401 });
    }

    const qboSessionManager = getQBOSessionManager();
    
    // Get QBO session for the current user
    const session = await qboSessionManager.getSession(user.id);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'QuickBooks connection required',
        details: 'Please connect your QuickBooks account first',
        requiresAuth: true
      }, { status: 401 });
    }

    // Fetch invoices using the QBO session manager
    const result = await qboSessionManager.getInvoices(session, limit, offset);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch invoices'
      }, { status: 500 });
    }

    // Transform QuickBooks invoice data to our frontend format
    const transformedInvoices = (result.data || []).map((invoice: any) => {
      const balance = parseFloat(invoice.Balance || 0);
      const totalAmount = parseFloat(invoice.TotalAmt || 0);
      const dueDate = invoice.DueDate;
      const today = new Date().toISOString().split('T')[0];
      
      let status: 'paid' | 'unpaid' | 'overdue' = 'unpaid';
      if (balance === 0) {
        status = 'paid';
      } else if (dueDate && dueDate < today) {
        status = 'overdue';
      }

      return {
        id: invoice.Id,
        docNumber: invoice.DocNumber || `INV-${invoice.Id}`,
        txnDate: invoice.TxnDate || new Date().toISOString().split('T')[0],
        dueDate: invoice.DueDate || new Date().toISOString().split('T')[0],
        totalAmount: totalAmount,
        balance: balance,
        customer: invoice.CustomerRef?.name || 'Unknown Customer',
        status: status,
        customerRef: invoice.CustomerRef,
        lineItems: invoice.Line || []
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedInvoices,
      count: transformedInvoices.length,
      hasMore: transformedInvoices.length === limit
    });

  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    
    // Return meaningful error messages
    let errorMessage = 'Failed to fetch invoices';
    let errorDetails = error.message;
    let requiresAuth = false;
    
    if (error.message.includes('authentication required') || 
        error.message.includes('access token') || 
        error.message.includes('OAuth') ||
        error.message.includes('connect your QuickBooks account')) {
      errorMessage = 'QuickBooks connection required';
      errorDetails = 'Please connect your QuickBooks account first';
      requiresAuth = true;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      requiresAuth: requiresAuth
    }, { 
      status: requiresAuth ? 401 : 500 
    });
  }
} 