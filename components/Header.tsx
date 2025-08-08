'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/mock-data'
import { useAuth } from './AuthContext'
import { TeamSwitcher } from './TeamSwitcher'
import { useTeam } from './TeamContext'

interface HeaderProps {
  isConnected?: boolean
}

interface InvoiceStats {
  totalInvoices: number
  totalRevenue: number
  paidCount: number
  unpaidCount: number
  overdueCount: number
}

export function Header({ isConnected = false }: HeaderProps) {
  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoices: 0,
    totalRevenue: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0
  })
  const [loading, setLoading] = useState(false)
  const { signOut } = useAuth()
  const { currentTeam } = useTeam()

  // Fetch real invoice stats when connected and team is available
  useEffect(() => {
    if (isConnected && currentTeam) {
      fetchInvoiceStats()
    }
  }, [isConnected, currentTeam])

  const fetchInvoiceStats = async () => {
    setLoading(true)
    try {
      if (!currentTeam) return
      const response = await fetch(`/api/invoices?teamId=${currentTeam.team_id}`)
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        const invoices = result.data
        const totalInvoices = invoices.length
        const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0)
        const paidCount = invoices.filter((inv: any) => Number(inv.balance) === 0).length
        const overdueCount = invoices.filter((inv: any) => inv.status === 'overdue').length
        const unpaidCount = totalInvoices - paidCount - overdueCount
        setStats({ totalInvoices, totalRevenue, paidCount, unpaidCount, overdueCount })
      }
    } catch (error) {
      console.error('Error fetching invoice stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    // AuthContext handles redirect automatically
  }
  
  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-lg sm:text-2xl">💼</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Invoice Manager
              </h1>
              <p className="text-purple-200 text-xs sm:text-sm">
                AI-Powered QuickBooks Integration
              </p>
            </div>
          </div>

          {/* Team Switcher */}
          <div className="hidden sm:block">
            <TeamSwitcher />
          </div>

          {/* Status Indicators and User Menu */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-emerald-400/30 text-xs sm:text-sm w-full sm:w-auto">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-emerald-100 font-medium">QuickBooks Connected</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-green-400/30 text-xs sm:text-sm w-full sm:w-auto">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-green-100 font-medium">AI Assistant Online</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-amber-400/30 text-xs sm:text-sm w-full sm:w-auto">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-amber-100 font-medium">Setup Required</span>
              </div>
            )}
            
            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-red-400/30 text-xs sm:text-sm text-red-100 hover:bg-red-500/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Display (when connected) - Dynamic values from QuickBooks */}
        {isConnected && (
          <div className="mt-4 sm:mt-6 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 w-full sm:w-auto">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">
                  {loading ? '...' : stats.totalInvoices}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">Total Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-emerald-400">
                  {loading ? '...' : formatCurrency(stats.totalRevenue)}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">Total Revenue</div>
              </div>
              <div className="text-center col-span-2 sm:col-span-1">
                <div className="text-lg sm:text-2xl font-bold text-blue-400">
                  {loading ? '...' : stats.paidCount}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">Paid</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-amber-400">
                  {loading ? '...' : stats.unpaidCount}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">Unpaid</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-red-400">
                  {loading ? '...' : stats.overdueCount}
                </div>
                <div className="text-white/60 text-xs sm:text-sm">Overdue</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 