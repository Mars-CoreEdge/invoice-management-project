'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTeam } from '@/components/TeamContext'
import * as Lucide from 'lucide-react'
import React from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const { canManageTeam, canEditInvoices, canUseAITools } = useTeam()

  const Icons: any = Lucide as any
  const IconDashboard = Icons.LayoutDashboard || (() => <span>🏠</span>)
  const IconInvoices = Icons.FileText || (() => <span>📄</span>)
  const IconUsers = Icons.Users || (() => <span>👥</span>)
  const IconBot = Icons.Bot || (() => <span>🤖</span>)
  const IconSettings = Icons.Settings || (() => <span>⚙️</span>)
  const AnalyticsIcon = Icons.BarChart3 || Icons.BarChart || Icons.AreaChart || Icons.TrendingUp || Icons.Activity || (() => <span>📊</span>)

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: IconDashboard,
      show: true
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: IconInvoices,
      show: true
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: AnalyticsIcon,
      show: true
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: IconUsers,
      show: canManageTeam
    },
    {
      name: 'AI Assistant',
      href: '/assistant',
      icon: IconBot,
      show: canUseAITools
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: IconSettings,
      show: true
    }
  ]

  return (
    <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-purple-600/30 text-white shadow-lg'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-white/10">
        <div className="space-y-2">
          {canEditInvoices && (
            <Link
              href="/invoices/new"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-purple-200 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded flex items-center justify-center">
                <span className="text-white text-xs">+</span>
              </div>
              New Invoice
            </Link>
          )}
          
          {canManageTeam && (
            <Link
              href="/teams/new"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-purple-200 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center justify-center">
                <span className="text-white text-xs">+</span>
              </div>
              New Team
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
