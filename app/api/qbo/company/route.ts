import { NextResponse } from 'next/server';
import { getQBOSessionManager } from '@/lib/qbo-session';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    // Get the current authenticated user
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        details: 'Please log in to access company information'
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

    // Get company information using the QBO session manager
    const result = await qboSessionManager.getCompanyInfo(session);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to fetch company information'
      }, { status: 500 });
    }

    // Transform QuickBooks company data
    const companyInfo = result.data;
    const transformedCompany = {
      id: companyInfo.Id,
      name: companyInfo.CompanyName,
      legalName: companyInfo.LegalName,
      address: companyInfo.CompanyAddr ? {
        line1: companyInfo.CompanyAddr.Line1,
        line2: companyInfo.CompanyAddr.Line2,
        city: companyInfo.CompanyAddr.City,
        state: companyInfo.CompanyAddr.CountrySubDivisionCode,
        postalCode: companyInfo.CompanyAddr.PostalCode,
        country: companyInfo.CompanyAddr.Country
      } : null,
      email: companyInfo.Email?.Address,
      phone: companyInfo.Telephone?.FreeFormNumber,
      website: companyInfo.WebAddr?.URI,
      fiscalYearStart: companyInfo.FiscalYearStartMonth,
      country: companyInfo.Country,
      supportedLanguages: companyInfo.SupportedLanguages,
      nameValue: companyInfo.NameValue,
      domain: companyInfo.Domain
    };

    return NextResponse.json({
      success: true,
      data: transformedCompany
    });

  } catch (error: any) {
    console.error('Error fetching company information:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch company information'
    }, { 
      status: 500 
    });
  }
} 