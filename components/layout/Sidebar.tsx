'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTeam } from '@/components/TeamContext'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Bot, 
  Settings,
  BarChart3
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { canManageTeam, canEditInvoices, canUseAITools } = useTeam()

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: FileText,
      show: true
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      show: true
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: Users,
      show: canManageTeam
    },
    {
      name: 'AI Assistant',
      href: '/assistant',
      icon: Bot,
      show: canUseAITools
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
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
