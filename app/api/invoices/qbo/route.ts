import { NextResponse } from 'next/server';
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server';
import { getQuickBooksService } from '@/lib/quickbooks';

export async function GET(request: Request) {
  try {
    console.log('=== Fetching invoices from QuickBooks for authenticated user ===');

    const supabase = await createSupabaseForRequest(request as any);
    const { data: { user }, error } = await getAuthenticatedUser(request as any);
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const qbs = getQuickBooksService();
    const loaded = await qbs.loadTokensForUser(user.id);
    if (!loaded) {
      return NextResponse.json({ success: false, error: 'QuickBooks not connected' }, { status: 401 });
    }

    const invoices = await qbs.findInvoices({ limit: 1000 });
    console.log(`Found ${invoices.length} invoices from QuickBooks`);

    // Format invoices for frontend
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.Id,
      docNumber: invoice.DocNumber,
      customerRef: invoice.CustomerRef,
      totalAmount: invoice.TotalAmt,
      balance: invoice.Balance || 0,
      dueDate: invoice.DueDate,
      txnDate: invoice.TxnDate,
      status: invoice.Balance == 0 ? 'paid' : 'unpaid',
      lineItems: (invoice.Line || []).map((line: any) => ({
        id: line.Id,
        description: line.Description || 'No description',
        amount: line.Amount,
        quantity: line.SalesItemLineDetail?.Qty || 1
      }))
    }));

    return NextResponse.json({
      success: true,
      data: formattedInvoices,
      count: formattedInvoices.length,
      companyName: (await qbs.getCompanyInfo()).CompanyName,
      realmId: qbs.getRealmId()
    });

  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch invoices',
      details: error.message
    }, { 
      status: 500 
    });
  }
} 