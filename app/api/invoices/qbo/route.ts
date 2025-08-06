import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('=== Fetching invoices using QBO session ===');
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get QBO session from query params (in a real app, this would come from secure storage)
    const sessionParam = searchParams.get('session');
    if (!sessionParam) {
      return NextResponse.json({
        success: false,
        error: 'QBO session not provided',
        details: 'Please connect to QuickBooks first'
      }, { 
        status: 401 
      });
    }

    let qboSession;
    try {
      qboSession = JSON.parse(decodeURIComponent(sessionParam));
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid QBO session data',
        details: 'Session data is corrupted or invalid'
      }, { 
        status: 400 
      });
    }

    // Validate QBO session
    if (!qboSession.realmId || !qboSession.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Invalid QBO session',
        details: 'Missing realmId or access_token'
      }, { 
        status: 401 
      });
    }

    console.log('Using QBO session:', {
      realmId: qboSession.realmId,
      hasAccessToken: !!qboSession.access_token,
      hasRefreshToken: !!qboSession.refresh_token
    });

    // Fetch invoices using the exact endpoint as requested
    const query = 'SELECT * FROM Invoice';
    const startposition = 1;
    const maxresults = 10;
    const minorversion = 65;
    const apiUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${qboSession.realmId}/query?query=${encodeURIComponent(query)}&startposition=${startposition}&maxresults=${maxresults}&minorversion=${minorversion}`;

    console.log('Fetching invoices from QuickBooks API:', apiUrl);

    const apiRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${qboSession.access_token}`,
        'Accept': 'application/json'
      }
    });

    const data = await apiRes.json();

    if (data.Fault) {
      console.error('QuickBooks API Error:', data.Fault);
      return NextResponse.json({
        success: false,
        error: 'QuickBooks API error',
        details: data.Fault
      }, { 
        status: 500 
      });
    }

    const invoices = data.QueryResponse?.Invoice || [];
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
      qboSession: {
        realmId: qboSession.realmId,
        hasAccessToken: !!qboSession.access_token,
        hasRefreshToken: !!qboSession.refresh_token
      }
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