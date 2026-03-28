'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Building2, Users, Inbox, Zap, ArrowLeft, Shield } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Overview', path: '/console', icon: LayoutDashboard, exact: true },
  { label: 'Analytics', path: '/console/analytics', icon: TrendingUp },
  { label: 'Organizations', path: '/console/organizations', icon: Building2 },
  { label: 'Users', path: '/console/users', icon: Users },
  { label: 'Demo Requests', path: '/console/demo-requests', icon: Inbox },
  { label: 'Automations', path: '/console/automations', icon: Zap },
]

interface ConsoleSidebarProps {
  fullName: string
  email: string
  onNavClick?: () => void
}

export function ConsoleSidebar({ fullName, email, onNavClick }: ConsoleSidebarProps) {
  const pathname = usePathname()
  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0A0F1A' }}>
      {/* Logo */}
      <Link
        href="/console"
        className="px-5 py-4 flex items-center gap-2.5 border-b transition-colors hover:opacity-80"
        style={{ borderColor: 'rgba(201,169,110,0.15)' }}
      >
        <Logo size={28} variant="full" className="[&>span]:text-[#EDE0C8]" />
      </Link>

      {/* Console badge */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(201,169,110,0.15)' }}
          >
            <Shield className="w-4 h-4" style={{ color: '#C9A96E' }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#EDE0C8' }}>Founder Console</p>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(168,124,48,0.2)', color: '#C9A96E' }}
            >
              Super Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.path
            : pathname === item.path || pathname.startsWith(item.path + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                isActive
                  ? 'font-medium shadow-sm'
                  : 'hover:opacity-80'
              )}
              style={isActive
                ? { backgroundColor: 'rgba(201,169,110,0.15)', color: '#C9A96E' }
                : { color: '#6B7280' }
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div style={{ borderTop: '1px solid rgba(201,169,110,0.15)' }}>
        {/* Back to Dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-3 text-xs transition-colors hover:opacity-80"
          style={{ color: '#6B7280' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <Separator className="opacity-20" />

      {/* Theme Toggle */}
      <div className="px-4 py-3">
        <ThemeToggle />
      </div>

      <Separator className="opacity-20" />

      {/* User Info */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(201,169,110,0.15)', color: '#C9A96E' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#EDE0C8' }}>{fullName}</p>
            <p className="text-[11px] truncate" style={{ color: '#6B7280' }}>{email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
