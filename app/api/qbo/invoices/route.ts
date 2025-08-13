import { NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { validateTeamAccess } from '@/lib/team-permissions'
import { getQBOSessionManager } from '@/lib/qbo-session'
import { logAudit } from '@/lib/audit'

// GET /api/qbo/invoices?teamId=...&limit=&offset=&customer=&status=&from=&to=&docNumber=
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId') || ''
    if (!teamId) {
      return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 })
    }

    await validateTeamAccess(user.id, teamId, ['can_view_invoices'])

    const limit = Number(searchParams.get('limit') || '100')
    const offset = Number(searchParams.get('offset') || '0')
    const customer = searchParams.get('customer')?.toLowerCase() || ''
    const status = searchParams.get('status')?.toLowerCase() || ''
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : null
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : null
    const docNumber = searchParams.get('docNumber')?.toLowerCase() || ''

    const manager = getQBOSessionManager()
    const session = await manager.getSession(user.id)
    if (!session) return NextResponse.json({ success: false, error: 'QuickBooks not connected' }, { status: 401 })

    const result = await manager.getInvoices(session, Math.min(limit, 500), offset)
    if (!result.success) return NextResponse.json(result, { status: 500 })

    let invoices = (result.data as any[]) || []

    // Basic filtering client-side to avoid complex QBO queries for now
    if (customer) invoices = invoices.filter(inv => String(inv.CustomerRef?.name || '').toLowerCase().includes(customer))
    if (status) invoices = invoices.filter(inv => {
      const isPaid = Number(inv.Balance || inv.balance || 0) === 0
      const s = isPaid ? 'paid' : 'unpaid'
      return s.includes(status)
    })
    if (docNumber) invoices = invoices.filter(inv => String(inv.DocNumber || '').toLowerCase().includes(docNumber))
    if (from) invoices = invoices.filter(inv => new Date(inv.TxnDate || inv.txnDate || inv.MetaData?.CreateTime) >= from)
    if (to) invoices = invoices.filter(inv => new Date(inv.TxnDate || inv.txnDate || inv.MetaData?.CreateTime) <= to)

    await logAudit({ userId: user.id, teamId, action: 'list', target: 'invoice', payload: { limit, offset, customer, status, from, to, docNumber } })
    return NextResponse.json({ success: true, data: invoices, count: invoices.length })
  } catch (error) {
    console.error('QBO list invoices error:', error)
    return NextResponse.json({ success: false, error: 'Failed to list invoices' }, { status: 500 })
  }
}

// POST /api/qbo/invoices?teamId=...
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId') || ''
    if (!teamId) {
      return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 })
    }

    await validateTeamAccess(user.id, teamId, ['can_edit_invoices'])

    const payload = await (request as any).json()
    const manager = getQBOSessionManager()
    const session = await manager.getSession(user.id)
    if (!session) return NextResponse.json({ success: false, error: 'QuickBooks not connected' }, { status: 401 })

    const result = await manager.createInvoice(session, payload)
    if (result.success) {
      await logAudit({ userId: user.id, teamId, action: 'create', target: 'invoice', targetId: (result.data as any)?.Id, payload })
    }
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    console.error('QBO create invoice error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 })
  }
}


