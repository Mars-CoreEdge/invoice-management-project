'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useTeam } from './TeamContext'
import { formatCurrency } from '../lib/mock-data'

interface QuickBooksStatus {
  connected: boolean;
  companyName?: string;
  realmId?: string;
  message: string;
}

interface Invoice {
  id: string;
  docNumber: string;
  customerRef: {
    value: string;
    name?: string;
  };
  totalAmount: number;
  balance: number;
  dueDate: string;
  txnDate: string;
  status: 'paid' | 'unpaid';
  lineItems: Array<{
    id: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
}

export function QuickBooksIntegration() {
  const auth: any = useAuth() as any
  const teamCtx: any = useTeam() as any
  const user = auth?.user
  const currentTeam = teamCtx?.currentTeam
  const [quickBooksStatus, setQuickBooksStatus] = useState<QuickBooksStatus | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  useEffect(() => {
    // Check URL params for OAuth callback status
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('connected')
    const error = urlParams.get('error')
    const message = urlParams.get('message')

    if (connected === 'true') {
      // Clean URL
      window.history.replaceState({}, '', '/dashboard')
      // Check QuickBooks status after successful connection
      checkQuickBooksStatus()
    }

    if (error) {
      let errorMessage = 'Failed to connect to QuickBooks. Please try again.'
      
      if (error === 'auth_declined') {
        errorMessage = 'QuickBooks authorization was declined. Please try connecting again.'
      } else if (error === 'oauth_failed') {
        errorMessage = 'OAuth authentication failed. Please check your QuickBooks credentials.'
      } else if (error === 'auth_failed') {
        errorMessage = message ? decodeURIComponent(message) : 'Authentication failed. Please try again.'
      }
      
      setError(errorMessage)
      // Clean URL
      window.history.replaceState({}, '', '/dashboard')
    }

    // Check QuickBooks status on component mount
    checkQuickBooksStatus()
  }, [])

  const checkQuickBooksStatus = async () => {
    setIsCheckingStatus(true)
    setError(null)
    
    try {
      // Check QuickBooks connection status (includes companyName)
      const statusResponse = await fetch('/api/quickbooks/status', { cache: 'no-store' })
      const statusResult = await statusResponse.json()
      
      if (statusResult.success) {
        const status = statusResult.status || statusResult
        setQuickBooksStatus({
          connected: !!(status.isAuthenticated ?? status.connected),
          companyName: status.companyName,
          realmId: status.realmId,
          message: (status.isAuthenticated ?? status.connected) ? 'Connected to QuickBooks' : 'Not connected'
        })
        
        if (status.isAuthenticated ?? status.connected) {
          // Fetch invoices if connected
          fetchInvoices()
        }
      } else {
        setError(statusResult.error || 'Failed to check QuickBooks status')
      }
    } catch (err: any) {
      console.error('Error checking QuickBooks status:', err)
      setError('Failed to check QuickBooks connection status')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // When connection flips to connected, fetch automatically (no manual refresh required)
  useEffect(() => {
    if (quickBooksStatus?.connected && invoices.length === 0 && !loading) {
      fetchInvoices()
    }
  }, [quickBooksStatus?.connected])

  // Refresh invoices on window focus if connected
  useEffect(() => {
    const onFocus = () => {
      if (quickBooksStatus?.connected) {
        fetchInvoices()
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus)
      }
    }
  }, [quickBooksStatus?.connected])

  const handleConnectQuickBooks = () => {
    setIsConnecting(true)
    setError(null)
    
    // Redirect to QuickBooks OAuth
    window.location.href = '/api/auth/quickbooks'
  }

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Pull invoices directly from QuickBooks (server will use current user's tokens)
      const response = await fetch('/api/invoices/qbo', { cache: 'no-store' })
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch invoices')
      }
      
      const items = Array.isArray(result.data) ? result.data : []
      setInvoices(items)
      // If backend returned companyName, reflect it
      if (result.companyName) {
        setQuickBooksStatus(prev => prev ? { ...prev, companyName: result.companyName } : prev)
      }
      console.log('✅ Fetched invoices:', result.data.length)
      
    } catch (err: any) {
      console.error('Error fetching invoices:', err)
      setError(err.message || 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshInvoices = () => {
    fetchInvoices()
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/quickbooks/status', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setQuickBooksStatus({ connected: false, message: 'QuickBooks disconnected' })
        setInvoices([])
        setError(null)
      } else {
        setError('Failed to disconnect QuickBooks')
      }
    } catch (err: any) {
      console.error('Error disconnecting QuickBooks:', err)
      setError('Failed to disconnect QuickBooks')
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-white/80">Please sign in to access QuickBooks integration.</p>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">QB</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">QuickBooks Integration</h2>
            <p className="text-white/60 text-sm">Manage your invoices with QuickBooks</p>
          </div>
        </div>
        
        {quickBooksStatus?.connected && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">Connected</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Connection Status */}
      {isCheckingStatus ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-white/60">Checking QuickBooks status...</p>
        </div>
      ) : !quickBooksStatus?.connected ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Connect to QuickBooks</h3>
          <p className="text-white/60 mb-6">
            Connect your QuickBooks account to access and manage your invoices.
          </p>
          <button
            onClick={handleConnectQuickBooks}
            disabled={isConnecting}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Connecting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>🔗</span>
                Connect QuickBooks
              </div>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Info */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">QuickBooks Connection</h4>
              <button
                onClick={handleDisconnect}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Disconnect
              </button>
            </div>
                         {/* Connection details */}
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="text-white/60">Company:</span>
                 <p className="text-white">{quickBooksStatus.companyName || 'Unknown'}</p>
               </div>
               <div>
                 <span className="text-white/60">Realm ID:</span>
                 <p className="text-white font-mono">{quickBooksStatus.realmId || 'Unknown'}</p>
               </div>
             </div>
          </div>

          {/* Invoices Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Invoices</h4>
              <button
                onClick={handleRefreshInvoices}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                ) : (
                  <span>🔄</span>
                )}
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-white/60">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📄</span>
                </div>
                <p className="text-white/60">No invoices found</p>
                <p className="text-white/40 text-sm">Try refreshing or check your QuickBooks account</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {invoice.docNumber?.split('-')[1] || 'INV'}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-white font-semibold">{invoice.docNumber}</h5>
                          <p className="text-white/60 text-sm">{invoice.customerRef?.name || 'Unknown Customer'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          {formatCurrency(invoice.totalAmount)}
                        </div>
                        <div className={`text-xs ${
                          invoice.status === 'paid' ? 'text-green-400' : 'text-amber-400'
                        }`}>
                          {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Due: {invoice.dueDate}</span>
                      {invoice.balance > 0 && (
                        <span>Balance: {formatCurrency(invoice.balance)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 