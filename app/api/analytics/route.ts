import { NextResponse } from 'next/server'
import { createSupabaseForRequest, getAuthenticatedUser } from '@/lib/supabase-server'
import { getTeamService } from '@/lib/team-service'

export const revalidate = 60

type TimeRangeKey = '7d' | '30d' | '90d' | '1y'

function getCutoffDates(range: TimeRangeKey) {
  const now = new Date()
  const msInDay = 86400000
  const duration = range === '7d' ? 7 * msInDay : range === '30d' ? 30 * msInDay : range === '90d' ? 90 * msInDay : 365 * msInDay
  const currentStart = new Date(now.getTime() - duration)
  const previousEnd = new Date(currentStart.getTime())
  const previousStart = new Date(previousEnd.getTime() - duration)
  return { now, currentStart, previousStart, previousEnd }
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseForRequest(request as any)

    const { data: { user }, error: authError } = await getAuthenticatedUser(request as any)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL((request as any).url)
    const teamId = searchParams.get('teamId')
    const range = (searchParams.get('range') as TimeRangeKey) || '30d'

    if (!teamId) {
      return NextResponse.json({ success: false, error: 'Team ID is required' }, { status: 400 })
    }

    const teamService = getTeamService()
    const roleCheck = await teamService.checkUserRole(user.id, teamId)
    if (!roleCheck.is_member) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const { currentStart, previousStart, previousEnd } = getCutoffDates(range)

    // Fetch minimal columns for current period
    const { data: currentRows, error: currentErr } = await supabase
      .from('invoices')
      .select('status,total_amount,balance,created_at,customer_name')
      .eq('team_id', teamId)
      .eq('created_by', user.id)
      .gte('created_at', currentStart.toISOString())
      .order('created_at', { ascending: false })

    if (currentErr) {
      console.error('Supabase fetch analytics current error:', currentErr)
      return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Fetch previous period for growth calculation
    const { data: previousRows, error: prevErr } = await supabase
      .from('invoices')
      .select('total_amount,created_at')
      .eq('team_id', teamId)
      .eq('created_by', user.id)
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', previousEnd.toISOString())

    if (prevErr) {
      console.error('Supabase fetch analytics previous error:', prevErr)
    }

    const current = Array.isArray(currentRows) ? currentRows : []
    const previous = Array.isArray(previousRows) ? previousRows : []

    const totalRevenue = current.reduce((sum: number, row: any) => sum + Number(row.total_amount || 0), 0)
    const totalInvoices = current.length
    const paidInvoices = current.filter((r: any) => Number(r.balance) === 0).length
    const overdueInvoices = current.filter((r: any) => r.status === 'overdue').length
    const pendingInvoices = current.filter((r: any) => r.status === 'pending' || (Number(r.balance) > 0 && r.status !== 'overdue')).length
    const averageInvoiceValue = totalInvoices ? totalRevenue / totalInvoices : 0

    const prevRevenue = previous.reduce((sum: number, row: any) => sum + Number(row.total_amount || 0), 0)
    const monthlyGrowth = prevRevenue === 0 ? (totalRevenue > 0 ? 100 : 0) : ((totalRevenue - prevRevenue) / prevRevenue) * 100

    // Top customers (sum and count by customer_name)
    const customerAgg = new Map<string, { name: string, total: number, count: number }>()
    for (const row of current) {
      const name = row.customer_name || 'Unknown Customer'
      const entry = customerAgg.get(name) || { name, total: 0, count: 0 }
      entry.total += Number(row.total_amount || 0)
      entry.count += 1
      customerAgg.set(name, entry)
    }
    const topCustomers = Array.from(customerAgg.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Monthly revenue buckets for the current period
    const monthlyMap = new Map<string, number>()
    for (const row of current) {
      const key = toMonthKey(new Date(row.created_at))
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(row.total_amount || 0))
    }
    const monthlyRevenue = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue]) => {
        const [yearStr, monthStr] = key.split('-')
        const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
        const month = date.toLocaleString('en-US', { month: 'short' })
        return { month, revenue }
      })

    const payload = {
      totalInvoices,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      averageInvoiceValue: Number(averageInvoiceValue.toFixed(2)),
      monthlyGrowth: Number(monthlyGrowth.toFixed(2)),
      topCustomers,
      monthlyRevenue
    }

    const res = NextResponse.json({ success: true, data: payload })
    res.headers.set('Cache-Control', 'private, max-age=60, s-maxage=60, stale-while-revalidate=300')
    return res
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}


