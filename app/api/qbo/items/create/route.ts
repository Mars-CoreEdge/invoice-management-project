import { NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getQBOSessionManager } from '@/lib/qbo-session'
import { validateTeamAccess } from '@/lib/team-permissions'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request as any)
    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId') || ''
    if (!teamId) return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 })
    await validateTeamAccess(user.id, teamId, ['can_edit_invoices'])

    const payload = await (request as any).json()
    const manager = getQBOSessionManager()
    const session = await manager.getSession(user.id)
    if (!session) return NextResponse.json({ success: false, error: 'QuickBooks not connected' }, { status: 401 })

    // Determine an income account
    const income = await manager.getDefaultIncomeAccount(session)
    const incomeRef = income.success && income.data ? { value: income.data.Id } : undefined

    const body = {
      Name: payload.Name || `Test Service ${Date.now()}`,
      Type: payload.Type || 'Service',
      UnitPrice: payload.UnitPrice || 25,
      IncomeAccountRef: payload.IncomeAccountRef || incomeRef
    }
    const result = await manager.createItem(session, body)
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    console.error('QBO create item error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 })
  }
}


