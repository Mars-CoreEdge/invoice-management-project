'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/mock-data'
import { useAuth } from './AuthContext'
import Link from 'next/link'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'

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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { signOut, user, profile } = useAuth()

  // Fetch real invoice stats when connected
  useEffect(() => {
    if (isConnected) {
      fetchInvoiceStats()
    }
  }, [isConnected])

  const fetchInvoiceStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/invoices')
      const result = await response.json()
      
      if (result.success && result.data) {
        const invoices = result.data
        const stats = {
          totalInvoices: invoices.length,
          totalRevenue: invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0),
          paidCount: invoices.filter((inv: any) => inv.balance === 0).length,
          unpaidCount: invoices.filter((inv: any) => inv.balance > 0 && inv.status !== 'overdue').length,
          overdueCount: invoices.filter((inv: any) => inv.status === 'overdue').length
        }
        setStats(stats)
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
                <span className="text-amber-100 font-medium">Connect QuickBooks to Start</span>
              </div>
            )}

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all text-white"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'User'} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-white">
                    {profile?.full_name || user?.email || 'User'}
                  </div>
                  <div className="text-xs text-purple-200">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50">
                  <div className="py-2">
                    <Link
                      href="/profile-setup"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Edit Profile
                    </Link>
                    <Link
                      href="/teams"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Team Settings
                    </Link>
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setShowProfileMenu(false)
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Stats */}
        {isConnected && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-purple-300 mb-1">Total Invoices</div>
              <div className="text-lg font-bold text-white">
                {loading ? '...' : stats.totalInvoices}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-purple-300 mb-1">Total Revenue</div>
              <div className="text-lg font-bold text-white">
                {loading ? '...' : formatCurrency(stats.totalRevenue)}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-green-300 mb-1">Paid</div>
              <div className="text-lg font-bold text-green-400">
                {loading ? '...' : stats.paidCount}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-yellow-300 mb-1">Unpaid</div>
              <div className="text-lg font-bold text-yellow-400">
                {loading ? '...' : stats.unpaidCount}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-red-300 mb-1">Overdue</div>
              <div className="text-lg font-bold text-red-400">
                {loading ? '...' : stats.overdueCount}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 