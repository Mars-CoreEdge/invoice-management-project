'use client'

import { useState, useEffect } from 'react'
import { InvoicePanel } from '@/components/InvoicePanel'
import { ChatPanel } from '@/components/ChatPanel'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'
import SessionInfo from '@/components/SessionInfo'
import Link from 'next/link'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [isQuickBooksConnected, setIsQuickBooksConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)


  useEffect(() => {
    // Check URL params for OAuth callback status
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('connected')
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
{`QUICKBOOKS_CLIENT_ID=ABRZKV0y73YEqiuQNZYwZm7ycQspsMJwlO8TWwD3XDj8D3zqhY
QUICKBOOKS_CLIENT_SECRET=MS1VHy2IWJWwYvCCoVHoHLgaCbD5ghCktrL9xcTn
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-10 animate-pulse delay-1000"></div>
      </div>
      
      <Header isConnected={isQuickBooksConnected} />
      
      {/* Success notification */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm border-l-4 border-emerald-400 p-3 sm:p-4 mb-3 sm:mb-4 mx-3 sm:mx-4 rounded-r-xl relative z-10">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3 animate-bounce" />
          <p className="text-emerald-100 font-semibold text-sm sm:text-base">
            ✨ Successfully connected to QuickBooks Online!
          </p>
          <span className="ml-2 text-emerald-400">📈</span>
        </div>
      </div>
      
      {/* Main responsive layout - stacks vertically on mobile, side-by-side on larger screens */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 p-3 sm:p-6 relative z-10 min-h-0">
        {/* Invoice Panel - full width on mobile, half width on desktop */}
        <div className="w-full lg:w-1/2 h-[calc(100vh-16rem)] lg:h-auto lg:flex-1">
          <InvoicePanel 
            selectedInvoice={selectedInvoice}
            onInvoiceSelect={handleInvoiceSelect}
          />
        </div>

        {/* AI Chat Panel - full width on mobile, half width on desktop */}
        <div className="w-full lg:w-1/2 h-[calc(100vh-16rem)] lg:h-auto lg:flex-1">
          <ChatPanel 
            selectedInvoice={selectedInvoice}
            onInvoiceSelect={handleInvoiceSelect}
          />
        </div>
      </div>

      {/* Session Info Panel - Debug/Development Only */}
      <div className="p-3 sm:p-6 relative z-10">
        <SessionInfo />
      </div>
    </div>
  )
} 