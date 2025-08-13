import { NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { validateTeamAccess } from '@/lib/team-permissions'
import { getQBOSessionManager } from '@/lib/qbo-session'
import { logAudit } from '@/lib/audit'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId') || ''
    if (!teamId) return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 })
    await validateTeamAccess(user.id, teamId, ['can_view_invoices'])

    const manager = getQBOSessionManager()
    const session = await manager.getSession(user.id)
    if (!session) return NextResponse.json({ success: false, error: 'QuickBooks not connected' }, { status: 401 })

    const by = (new URL((request as any).url)).searchParams.get('by') || 'id'
    const result = by === 'doc'
      ? await manager.getInvoiceByDocNumber(session, params.id)
      : await manager.getInvoiceById(session, params.id)
    return NextResponse.json(result, { status: result.success ? 200 : 404 })
  } catch (error) {
    console.error('QBO get invoice error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId') || ''
    if (!teamId) return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 })
    await validateTeamAccess(user.id, teamId, ['can_edit_invoices'])

    const patch = await (request as any).json()
    const manager = getQBOSessionManager()
    const session = await manager.getSession(user.id)
    if (!session) return NextResponse.json({ success: false, error: 'QuickBooks not connected' }, { status: 401 })

    const result = await manager.updateInvoice(session, params.id, patch)
    if (result.success) {
      await logAudit({ userId: user.id, teamId, action: 'update', target: 'invoice', targetId: params.id, payload: patch })
    }
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    console.error('QBO update invoice error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId') || ''
    if (!teamId) return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 })
    await validateTeamAccess(user.id, teamId, ['can_delete_invoices'])

    const manager = getQBOSessionManager()
    const session = await manager.getSession(user.id)
    if (!session) return NextResponse.json({ success: false, error: 'QuickBooks not connected' }, { status: 401 })

    const result = await manager.deleteInvoice(session, params.id)
    if (result.success) {
      await logAudit({ userId: user.id, teamId, action: 'delete', target: 'invoice', targetId: params.id })
    }
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    console.error('QBO delete invoice error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete invoice' }, { status: 500 })
  }
}


