'use client'

import { useAuth } from './AuthContext'
import { decodeJWT, getTimeUntilExpiry, needsRefresh } from '@/lib/jwt-utils'
import { authenticatedFetch } from '@/lib/jwt-utils'
import { useState } from 'react'

export default function SessionInfo() {
  const { user, session, refreshSession } = useAuth()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  if (!user || !session) {
    return (
      <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 text-yellow-200">
        No active session found
      </div>
    )
  }

  const payload = decodeJWT(session.access_token)
  const timeUntilExpiry = getTimeUntilExpiry(session.access_token)
  const shouldRefresh = needsRefresh(session.access_token)

  const testProtectedAPI = async () => {
    setLoading(true)
    try {
      const response = await authenticatedFetch('/api/protected')
      const data = await response.json()
      setApiResponse(data)
    } catch (error) {
      console.error('API test error:', error)
      setApiResponse({ error: 'Failed to call protected API' })
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshSession = async () => {
    setLoading(true)
    try {
      await refreshSession()
      setApiResponse({ message: 'Session refreshed successfully' })
    } catch (error) {
      console.error('Refresh error:', error)
      setApiResponse({ error: 'Failed to refresh session' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Session Information</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-purple-200">User Email:</span>
            <span className="text-white">{user.email}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-purple-200">User ID:</span>
            <span className="text-white font-mono">{user.id}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-purple-200">Session ID:</span>
            <span className="text-white font-mono">{payload?.session_id || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-purple-200">Token Expires:</span>
            <span className={`font-mono ${shouldRefresh ? 'text-red-400' : 'text-green-400'}`}>
              {payload?.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Unknown'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-purple-200">Time Until Expiry:</span>
            <span className={`font-mono ${shouldRefresh ? 'text-red-400' : 'text-green-400'}`}>
              {timeUntilExpiry} seconds
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-purple-200">Needs Refresh:</span>
            <span className={shouldRefresh ? 'text-red-400' : 'text-green-400'}>
              {shouldRefresh ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-purple-200">Provider:</span>
            <span className="text-white">{payload?.app_metadata?.provider || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">JWT Token Actions</h3>
        
        <div className="space-y-3">
          <button
            onClick={testProtectedAPI}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Protected API'}
          </button>
          
          <button
            onClick={handleRefreshSession}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Session'}
          </button>
        </div>

        {apiResponse && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-sm font-semibold text-white mb-2">API Response:</h4>
            <pre className="text-xs text-purple-200 overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Raw JWT Token</h3>
        <div className="text-xs text-purple-200 break-all">
          {session.access_token}
        </div>
      </div>
    </div>
  )
} 