'use client'

import { useState, useEffect } from 'react'
import { InvoicePanel } from '@/components/InvoicePanel'
import { ChatPanel } from '@/components/ChatPanel'
import { QuickBooksIntegration } from '@/components/QuickBooksIntegration'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import { useTeam } from '@/components/TeamContext'
import { AppLayout } from '@/components/layout/AppLayout'
import SessionInfo from '@/components/SessionInfo'
import Link from 'next/link'

export default function Dashboard() {
  const auth: any = useAuth()
  const user = auth?.user
  const loading = auth?.loading
  const teamCtx: any = useTeam()
  const currentTeam = teamCtx?.currentTeam
  const [isQuickBooksConnected, setIsQuickBooksConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [quickBooksStatus, setQuickBooksStatus] = useState<any>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  const checkQuickBooksStatus = async () => {
    setCheckingStatus(true)
    try {
      const response = await fetch('/api/quickbooks/status')
      const result = await response.json()
      if (result.success) {
        // API returns { success, connected, companyName?, realmId? }
        setQuickBooksStatus(result)
        setIsQuickBooksConnected(!!result.connected)
      }
    } catch (error) {
      console.error('Error checking QuickBooks status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  useEffect(() => {
    // Check URL params for OAuth callback status
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('connected')
    const refresh = urlParams.get('refresh')
    const error = urlParams.get('error')
    const message = urlParams.get('message')

    if (connected === 'true') {
      setIsQuickBooksConnected(true)
      // Clean URL
      window.history.replaceState({}, '', '/dashboard')
    }

    if (error) {
      let errorMessage = 'Failed to connect to QuickBooks. Please try again.'
      
      if (error === 'auth_declined') {
        errorMessage = 'QuickBooks authorization was declined. Please try connecting again to access your invoice data.'
      } else if (error === 'config_missing') {
        errorMessage = message ? decodeURIComponent(message) : 'Configuration error: Missing environment variables.'
      } else if (error === 'oauth_failed') {
        errorMessage = 'OAuth authentication failed. Please check your QuickBooks credentials.'
      } else if (error === 'auth_failed') {
        errorMessage = message ? decodeURIComponent(message) : 'Authentication failed. Please try again.'
      }
      
      setConnectionError(errorMessage)
      // Clean URL
      window.history.replaceState({}, '', '/dashboard')
    }

    // Check current QuickBooks status on load
    checkQuickBooksStatus()
    
    // If refresh parameter is present, check status again after a short delay
    if (refresh === 'true') {
      setTimeout(() => {
        checkQuickBooksStatus()
        // Clean URL
        window.history.replaceState({}, '', '/dashboard')
      }, 1000)
    }
  }, [])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // AuthContext handles redirects automatically
  if (!user) {
    return null
  }

  // Show no team state
  if (!currentTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">👥</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">No Team Selected</h1>
            <p className="text-purple-200 mb-6">
              You need to be part of a team to access the dashboard.
            </p>
            <div className="space-y-3">
              <Link href="/teams/new">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0">
                  Create New Team
                </Button>
              </Link>
              <Link href="/teams">
                <Button className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 py-3 px-6 rounded-2xl">
                  View My Teams
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // QuickBooks connect is handled by API route which redirects to external OAuth

  const handleInvoiceSelect = (invoice: any) => {
    setSelectedInvoice(invoice)
  }

  if (!isQuickBooksConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 left-1/4 w-60 h-60 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400 opacity-10 animate-bounce delay-500"></div>
        </div>
        
        <Header />
        
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
          <div className="max-w-2xl w-full mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-white/20 relative overflow-hidden">
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
              
              {/* Main Icon */}
              <div className="relative z-10 mb-6 sm:mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse shadow-lg">
                  <div className="text-3xl sm:text-4xl">⚡</div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  AI Invoice Manager
                </h1>
                <p className="text-purple-200 text-base sm:text-lg flex items-center justify-center gap-2">
                  ✨ Powered by QuickBooks & AI ✨
                </p>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Connect to QuickBooks</h2>
                <p className="text-purple-100 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  Start managing your invoices with AI-powered automation. Connect your QuickBooks account to unlock intelligent invoice management.
                </p>
                
                                 {/* Debug Status - Commented out for production */}
                 {/* {quickBooksStatus && (
                   <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left">
                     <div className="flex items-center justify-between mb-3">
                       <div className="font-semibold text-blue-200">Debug Status</div>
                       <button
                         onClick={checkQuickBooksStatus}
                         disabled={checkingStatus}
                         className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                       >
                         <RotateCcw className={`w-3 h-3 ${checkingStatus ? 'animate-spin' : ''}`} />
                         Refresh
                       </button>
                     </div>
                     <div className="text-blue-100 text-sm space-y-1">
                       <div>Authenticated: <span className={quickBooksStatus.isAuthenticated ? 'text-green-300' : 'text-red-300'}>{quickBooksStatus.isAuthenticated ? 'Yes' : 'No'}</span></div>
                       <div>Has Access Token: <span className={quickBooksStatus.hasAccessToken ? 'text-green-300' : 'text-red-300'}>{quickBooksStatus.hasAccessToken ? 'Yes' : 'No'}</span></div>
                       <div>Has Realm ID: <span className={quickBooksStatus.hasRealmId ? 'text-green-300' : 'text-red-300'}>{quickBooksStatus.hasRealmId ? 'Yes' : 'No'}</span></div>
                       <div>Realm ID: <span className="text-blue-300">{quickBooksStatus.realmId || 'None'}</span></div>
                       <div>Last Check: <span className="text-blue-300">{new Date(quickBooksStatus.timestamp).toLocaleTimeString()}</span></div>
                     </div>
                   </div>
                 )} */}
                
                {connectionError && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-left">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold text-red-200 mb-2">Configuration Error</div>
                        <div className="text-red-100 mb-4 text-sm sm:text-base">{connectionError}</div>
                        {connectionError.includes('environment variable') && (
                          <div className="bg-red-600/20 rounded-xl p-3 sm:p-4 border border-red-400/20">
                            <div className="font-medium mb-3 text-red-200">Quick Fix:</div>
                            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-red-100 mb-4">
                              <li>Create a <code className="bg-red-400/20 px-2 py-1 rounded text-red-200">.env.local</code> file in your project root</li>
                              <li>Add the following variables:</li>
                            </ol>
                            <pre className="bg-red-900/30 p-3 sm:p-4 rounded-lg text-xs overflow-x-auto text-red-100 border border-red-400/20">
{`QUICKBOOKS_CLIENT_ID=ABSFYKSSif94K6kxnbWNKQdhaZymuzERq3vRsStyiBWDXsZQlN
QUICKBOOKS_CLIENT_SECRET=cvTx8XlEQL6d2yOh7hNEP8wUedaQCSIswJawlJVu
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=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`}
                            </pre>
                            <div className="mt-3">
                              <a 
                                href="https://developer.intuit.com/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-red-300 hover:text-red-200 underline transition-colors text-sm"
                              >
                                Get QuickBooks API credentials →
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                                 <Link 
                   href="/api/auth/quickbooks"
                   className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0 group flex items-center justify-center ${connectionError?.includes('environment variable') ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   {connectionError?.includes('environment variable') ? (
                     <>
                       <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-3 group-hover:rotate-12 transition-transform" />
                       Configure Environment Variables First
                     </>
                   ) : (
                     <>
                       <span className="mr-3">✨</span>
                       Connect QuickBooks Online
                     </>
                   )}
                 </Link>

                <p className="text-purple-300 text-xs sm:text-sm mt-4 sm:mt-6 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Your data is secure and encrypted
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-purple-200">
            Welcome to {currentTeam.team_name} - Manage your invoices and QuickBooks integration
          </p>
        </div>

        {/* QuickBooks Connection Status */}
        {!isQuickBooksConnected && (
          <div className="mb-6 bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">Connect QuickBooks</h3>
                <p className="text-purple-200 mb-4">
                  Connect your QuickBooks account to sync invoices and enable AI-powered features.
                </p>
                <Link href="/api/auth/quickbooks">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300">
                    Connect QuickBooks
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QuickBooks Integration Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">QuickBooks Integration</h2>
            <QuickBooksIntegration />
          </div>

          {/* AI Chat Panel */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">AI Assistant</h2>
            <ChatPanel 
              selectedInvoice={selectedInvoice}
              onInvoiceSelect={handleInvoiceSelect}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/invoices">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-white font-semibold mb-2">View Invoices</h3>
                <p className="text-purple-200 text-sm">Browse and manage all your invoices</p>
              </div>
            </Link>
            
            <Link href="/invoices/new">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">➕</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Create Invoice</h3>
                <p className="text-purple-200 text-sm">Generate a new invoice for your customer</p>
              </div>
            </Link>
            
            <Link href="/assistant">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-white font-semibold mb-2">AI Assistant</h3>
                <p className="text-purple-200 text-sm">Get help with AI-powered insights</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 