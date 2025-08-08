import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'

// Mock invoice data for demonstration
const mockInvoices = [
  {
    id: '1',
    invoice_number: 'INV-2024-001',
    customer_name: 'Acme Corporation',
    total_amount: 2500.00,
    balance: 2500.00,
    status: 'pending',
    due_date: '2024-02-15',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    invoice_number: 'INV-2024-002',
    customer_name: 'Tech Solutions Inc',
    total_amount: 1800.00,
    balance: 0.00,
    status: 'paid',
    due_date: '2024-02-10',
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-12T09:15:00Z'
  },
  {
    id: '3',
    invoice_number: 'INV-2024-003',
    customer_name: 'Global Industries',
    total_amount: 3200.00,
    balance: 3200.00,
    status: 'overdue',
    due_date: '2024-01-20',
    created_at: '2024-01-05T11:20:00Z',
    updated_at: '2024-01-05T11:20:00Z'
  },
  {
    id: '4',
    invoice_number: 'INV-2024-004',
    customer_name: 'Startup Ventures',
    total_amount: 950.00,
    balance: 950.00,
    status: 'draft',
    due_date: '2024-03-01',
    created_at: '2024-01-20T16:45:00Z',
    updated_at: '2024-01-20T16:45:00Z'
  },
  {
    id: '5',
    invoice_number: 'INV-2024-005',
    customer_name: 'Enterprise Solutions',
    total_amount: 4200.00,
    balance: 0.00,
    status: 'paid',
    due_date: '2024-02-05',
    created_at: '2024-01-08T13:15:00Z',
    updated_at: '2024-01-10T08:30:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseForRequest(request)
    
    // Get current user (supports Bearer Authorization too)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // NextRequest doesn't expose .url type in our d.ts; use as any
    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    const teamService = getTeamService()

    // Check if user has access to view invoices in this team
    const roleCheck = await teamService.checkUserRole(user.id, teamId)
    if (!roleCheck.is_member) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // For now, return mock data
    // In a real implementation, you would query the database for invoices
    // filtered by teamId and user permissions
    
    return NextResponse.json({
      success: true,
      data: mockInvoices
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseForRequest(request)
    
    // Get current user (supports Bearer Authorization too)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await (request as any).json()
    const { teamId, ...invoiceData } = body

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Team ID is required' },
        { status: 400 }
      )
    }

    const teamService = getTeamService()

    // Check if user can create invoices in this team
    const roleCheck = await teamService.checkUserRole(user.id, teamId, ['admin', 'accountant'])
    if (!roleCheck.has_permission) {
      return NextResponse.json(
        { success: false, error: 'Admin or accountant role required to create invoices' },
        { status: 403 }
      )
    }

    // For now, return a mock created invoice
    // In a real implementation, you would save to the database
    const newInvoice = {
      id: Date.now().toString(),
      invoice_number: `INV-2024-${String(mockInvoices.length + 1).padStart(3, '0')}`,
      ...invoiceData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: newInvoice,
      message: 'Invoice created successfully'
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 