'use client'

import { getInvoiceStats, formatCurrency } from '../lib/mock-data'
import { useAuth } from './AuthContext'

interface HeaderProps {
  isConnected?: boolean
}

export function Header({ isConnected = false }: HeaderProps) {
  const stats = getInvoiceStats()
  const { signOut } = useAuth()

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

        {/* Stats Display (when connected) - Dynamic values from mock invoices */}
        {isConnected && (
          <div className="mt-4 sm:mt-6 flex items-center justify-center bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 w-full sm:w-auto">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white">{stats.totalInvoices}</div>
                <div className="text-white/60 text-xs sm:text-sm">Total Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-white/60 text-xs sm:text-sm">Total Revenue</div>
              </div>
              <div className="text-center col-span-2 sm:col-span-1">
                <div className="text-lg sm:text-2xl font-bold text-blue-400">{stats.paidCount}</div>
                <div className="text-white/60 text-xs sm:text-sm">Paid</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-amber-400">{stats.unpaidCount}</div>
                <div className="text-white/60 text-xs sm:text-sm">Unpaid</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-red-400">{stats.overdueCount}</div>
                <div className="text-white/60 text-xs sm:text-sm">Overdue</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 