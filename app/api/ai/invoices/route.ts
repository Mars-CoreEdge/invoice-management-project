import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getQBOSessionManager } from '@/lib/qbo-session';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const qboSession = getQBOSessionManager();
    const session = await qboSession.getSession(user.id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'QuickBooks not connected' },
        { status: 400 }
      );
    }

    const result = await qboSession.getInvoices(session, 50, 0);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const invoices = result.data?.map((invoice: any) => ({
      id: invoice.Id,
      docNumber: invoice.DocNumber,
      txnDate: invoice.TxnDate,
      dueDate: invoice.DueDate,
      totalAmount: invoice.TotalAmt,
      balance: invoice.Balance,
      customer: invoice.CustomerRef?.name || 'Unknown Customer',
      status: invoice.Balance === 0 ? 'paid' : 
             (invoice.DueDate && new Date(invoice.DueDate) < new Date()) ? 'overdue' : 'unpaid',
      emailStatus: invoice.EmailStatus || 'Unknown',
      printStatus: invoice.PrintStatus || 'Unknown',
      lineItems: invoice.Line?.map((line: any) => ({
        description: line.Description || 'Item',
        quantity: line.Qty || 1,
        unitPrice: line.UnitBasedExpenseLineDetail?.UnitPrice || line.SalesBasedExpenseLineDetail?.UnitPrice || 0,
        amount: line.Amount || 0
      })) || []
    })) || [];

    return NextResponse.json({
      success: true,
      data: invoices,
      count: invoices.length
    });

  } catch (error: any) {
    console.error('Error fetching invoices for AI:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 