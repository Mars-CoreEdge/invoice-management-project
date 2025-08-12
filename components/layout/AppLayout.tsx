'use client'

import { useAuth } from '@/components/AuthContext'
import { useTeam } from '@/components/TeamContext'
import { Header } from '@/components/Header'
import { Sidebar } from './Sidebar'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
// no Link import needed here

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading: authLoading } = useAuth()
  const { currentTeam, loading: teamLoading } = useTeam()
  const pathname = usePathname()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Show loading state
  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Note: Do NOT block rendering when no team is selected. Pages that require a team
  // should handle that themselves. This avoids unmounting dashboard content and losing
  // client state (e.g., chat messages) during background checks or tab focus events.

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-10 animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <Header isConnected={true} />

      {/* Main Content */}
      <div className="flex-1 flex relative z-10 min-h-0">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
