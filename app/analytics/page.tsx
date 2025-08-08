'use client'

import { useState, useEffect } from 'react'
import { useTeam } from '@/components/TeamContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  FileText,
  Users,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface AnalyticsData {
  totalInvoices: number
  totalRevenue: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  averageInvoiceValue: number
  monthlyGrowth: number
  topCustomers: Array<{
    name: string
    total: number
    count: number
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
}

export default function AnalyticsPage() {
  const { currentTeam } = useTeam()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    if (currentTeam) {
      fetchAnalytics()
    }
  }, [currentTeam, timeRange])

  const fetchAnalytics = async () => {
    try {
      // Pull invoices for current team and compute metrics client-side
      const res = await fetch(`/api/invoices?teamId=${currentTeam?.team_id}`)
      const json = await res.json()
      const invoices = Array.isArray(json.data) ? json.data : []
console.log(invoices)
      // Filter by time range
      const now = new Date()
      const cutoff = new Date(
        timeRange === '7d' ? now.getTime() - 7*86400000 :
        timeRange === '30d' ? now.getTime() - 30*86400000 :
        timeRange === '90d' ? now.getTime() - 90*86400000 :
        now.getTime() - 365*86400000
      )

      const rangeInvoices = invoices.filter((i: any) => new Date(i.created_at) >= cutoff)
      const totalRevenue = rangeInvoices.reduce((s: number, i: any) => s + Number(i.total_amount||0), 0)
      const paid = rangeInvoices.filter((i: any) => Number(i.balance) === 0)
      const overdue = rangeInvoices.filter((i: any) => i.status === 'overdue')
      const pending = rangeInvoices.filter((i: any) => i.status === 'pending' || (Number(i.balance) > 0 && i.status !== 'overdue'))

      const avg = rangeInvoices.length ? totalRevenue / rangeInvoices.length : 0
      const mockData: AnalyticsData = {
        totalInvoices: 156,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        paidInvoices: paid.length,
        pendingInvoices: pending.length,
        overdueInvoices: overdue.length,
        averageInvoiceValue: Number(avg.toFixed(2)),
        monthlyGrowth: 12.5,
        topCustomers: [
          { name: 'Acme Corporation', total: 25000, count: 8 },
          { name: 'Tech Solutions Inc', total: 18000, count: 6 },
          { name: 'Global Industries', total: 15000, count: 5 },
          { name: 'Enterprise Solutions', total: 12000, count: 4 },
          { name: 'Startup Ventures', total: 8000, count: 3 }
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 18000 },
          { month: 'Feb', revenue: 22000 },
          { month: 'Mar', revenue: 19000 },
          { month: 'Apr', revenue: 25000 },
          { month: 'May', revenue: 28000 },
          { month: 'Jun', revenue: 32000 }
        ]
      }

      setAnalytics(mockData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading analytics...</div>
        </div>
      </AppLayout>
    )
  }

  if (!analytics) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <div className="text-red-400 text-xl mb-4">Error</div>
          <div className="text-purple-200">Failed to load analytics data</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
              <p className="text-purple-200">
                Business insights for {currentTeam?.team_name}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                analytics.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {analytics.monthlyGrowth >= 0 ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                {Math.abs(analytics.monthlyGrowth)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <div className="text-purple-200 text-sm">Total Revenue</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {analytics.totalInvoices}
            </div>
            <div className="text-purple-200 text-sm">Total Invoices</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatCurrency(analytics.averageInvoiceValue)}
            </div>
            <div className="text-purple-200 text-sm">Average Invoice</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {analytics.overdueInvoices}
            </div>
            <div className="text-purple-200 text-sm">Overdue Invoices</div>
          </div>
        </div>

        {/* Invoice Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Invoice Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-purple-200">Paid</span>
                </div>
                <span className="text-white font-medium">{analytics.paidInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-purple-200">Pending</span>
                </div>
                <span className="text-white font-medium">{analytics.pendingInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-purple-200">Overdue</span>
                </div>
                <span className="text-white font-medium">{analytics.overdueInvoices}</span>
              </div>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Customers</h3>
            <div className="space-y-3">
              {analytics.topCustomers.slice(0, 5).map((customer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{customer.name}</div>
                    <div className="text-purple-200 text-sm">{customer.count} invoices</div>
                  </div>
                  <div className="text-white font-medium">
                    {formatCurrency(customer.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Revenue</h3>
            <div className="space-y-3">
              {analytics.monthlyRevenue.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-purple-200">{month.month}</span>
                  <span className="text-white font-medium">
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Growth Trend</span>
              </div>
              <p className="text-purple-200 text-sm">
                Revenue has grown by {analytics.monthlyGrowth}% compared to last month.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-red-400" />
                <span className="text-white font-medium">Collections</span>
              </div>
              <p className="text-purple-200 text-sm">
                {analytics.overdueInvoices} invoices are overdue and need attention.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Customer Focus</span>
              </div>
              <p className="text-purple-200 text-sm">
                Top 5 customers account for {Math.round((analytics.topCustomers.reduce((sum, c) => sum + c.total, 0) / analytics.totalRevenue) * 100)}% of revenue.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">Performance</span>
              </div>
              <p className="text-purple-200 text-sm">
                Average invoice value is {formatCurrency(analytics.averageInvoiceValue)}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
