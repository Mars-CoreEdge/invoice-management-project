'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import OAuthButtons from './OAuthButtons'
import { useAuth } from './AuthContext'
import { decodeJWT, getTimeUntilExpiry, needsRefresh } from '@/lib/jwt-utils'
import Link from 'next/link'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { user, session, signIn, signUp, signOut, isAuthenticated, isInitialized } = useAuth()

  // AuthContext handles redirects automatically

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        // Auth context will handle redirect automatically
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      // Auth context will handle redirect automatically
    } catch (error: any) {
      console.error('Logout error:', error)
    }
  }

  // Debug function to show session info
  const showSessionInfo = () => {
    if (session) {
      const payload = decodeJWT(session.access_token)
      console.log('Current Session:', {
        user: session.user.email,
        expiresAt: payload?.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Unknown',
        timeUntilExpiry: payload ? getTimeUntilExpiry(session.access_token) : 'Unknown',
        needsRefresh: payload ? needsRefresh(session.access_token) : 'Unknown'
      })
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-white/20 relative overflow-hidden">
        {/* Card Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
        
        {/* Main Icon */}
        <div className="relative z-10 mb-6 sm:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse shadow-lg">
            <div className="text-3xl sm:text-4xl">🔐</div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-purple-200 text-base sm:text-lg flex items-center justify-center gap-2">
            ✨ {mode === 'login' ? 'Sign in to your account' : 'Create your account'} ✨
          </p>
        </div>
        
                 <div className="relative z-10">
           <form className="space-y-6" onSubmit={handleSubmit}>
             <div className="space-y-4">
               <div>
                 <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
                   Email address
                 </label>
                 <input
                   id="email"
                   name="email"
                   type="email"
                   autoComplete="email"
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                   placeholder="Enter your email"
                 />
               </div>

               <div>
                 <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
                   Password
                 </label>
                 <input
                   id="password"
                   name="password"
                   type="password"
                   autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                   required
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                   placeholder="Enter your password"
                 />
               </div>
             </div>

             {error && (
               <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 text-red-200 text-sm">
                 {error}
               </div>
             )}

             {message && (
               <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4 text-green-200 text-sm">
                 {message}
               </div>
             )}

             <button
               type="submit"
               disabled={loading}
               className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-2xl text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0 disabled:opacity-50 disabled:transform-none"
             >
               {loading ? (
                 <span className="flex items-center justify-center">
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                   Loading...
                 </span>
               ) : (
                 <>
                   <span className="mr-3">✨</span>
                   {mode === 'login' ? 'Sign in' : 'Sign up'}
                 </>
               )}
             </button>

             <div className="text-center">
               <p className="text-purple-300 text-sm">
                 {mode === 'login' 
                   ? "Don't have an account? " 
                   : "Already have an account? "
                 }
                                   <Link 
                    href={mode === 'login' ? '/auth/signup' : '/auth/login'}
                    className="font-medium text-purple-200 hover:text-white underline transition-colors"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </Link>
               </p>
             </div>
           </form>

           {/* OAuth Buttons - Outside the form to prevent validation conflicts */}
           <OAuthButtons mode={mode} />

                       <div className="text-purple-300 text-xs sm:text-sm flex items-center justify-center gap-2 mt-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Your data is secure and encrypted
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            </div>

            {/* Debug Buttons - Remove in production */}
            <div className="mt-4 text-center space-y-2">
              <button
                onClick={handleLogout}
                className="text-xs text-purple-300 hover:text-white underline block"
              >
                Clear Session (Debug)
              </button>
              {session && (
                <button
                  onClick={showSessionInfo}
                  className="text-xs text-blue-300 hover:text-white underline block"
                >
                  Show Session Info (Debug)
                </button>
              )}
            </div>
         </div>
      </div>
    </div>
  )
} 