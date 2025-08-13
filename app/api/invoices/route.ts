import { NextResponse } from 'next/server'
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

export async function GET(request: Request) {
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

    // Fetch invoices from Supabase, scoped by team and created_by
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('team_id', teamId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch invoices error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch invoices' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    const now = new Date().toISOString()
    const invoice_number = invoiceData.invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*100000).toString().padStart(5,'0')}`

    const insertPayload = {
      team_id: teamId,
      created_by: user.id,
      invoice_number,
      customer_name: invoiceData.customer_name,
      customer_email: invoiceData.customer_email,
      customer_address: invoiceData.customer_address,
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      items: invoiceData.items || [],
      subtotal: invoiceData.subtotal || 0,
      tax: invoiceData.tax || 0,
      total_amount: invoiceData.total_amount || 0,
      balance: (invoiceData.balance ?? invoiceData.total_amount) || 0,
      status: invoiceData.status || 'draft',
      notes: invoiceData.notes || '',
      terms: invoiceData.terms || '',
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      console.error('Supabase insert invoice error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, message: 'Invoice created successfully' })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request)
    const { data: { user } } = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await (request as any).json()
    const { teamId, id, updates } = body
    if (!teamId || !id) return NextResponse.json({ success: false, error: 'Team ID and invoice ID are required' }, { status: 400 })

    const teamService = getTeamService()
    const roleCheck = await teamService.checkUserRole(user.id, teamId, ['admin', 'accountant'])
    if (!roleCheck.has_permission) return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })

    const { data, error } = await supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('team_id', teamId)
      .eq('created_by', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Supabase update invoice error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request)
    const { data: { user } } = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId')
    const id = searchParams.get('id')
    if (!teamId || !id) return NextResponse.json({ success: false, error: 'Team ID and invoice ID are required' }, { status: 400 })

    const teamService = getTeamService()
    const roleCheck = await teamService.checkUserRole(user.id, teamId, ['admin'])
    if (!roleCheck.has_permission) return NextResponse.json({ success: false, error: 'Admin role required' }, { status: 403 })

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('team_id', teamId)
      .eq('created_by', user.id)

    if (error) {
      console.error('Supabase delete invoice error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete invoice' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}