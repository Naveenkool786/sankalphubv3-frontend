'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ROLE_CONFIGS } from '@/lib/roles'
import type { UserRole } from '@/types/database'
import { toast } from 'sonner'

interface SidebarProps {
  role: UserRole
  orgName: string
  fullName: string
  email: string
  onNavClick?: () => void
}

export function Sidebar({ role, orgName, fullName, email, onNavClick }: SidebarProps) {
  const pathname = usePathname()
  const config = ROLE_CONFIGS[role]
  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const orgInitials = orgName.slice(0, 2).toUpperCase()

  function handleComingSoon() {
    toast.info('Coming soon', { description: 'This feature is being built — check back soon!' })
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <Link
        href="/"
        className="px-5 py-4 flex items-center gap-2.5 border-b border-border hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-base tracking-tight">SankalpHub</span>
      </Link>

      {/* Org + Role */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {orgInitials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{orgName}</p>
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', config.badgeClass)}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {config.navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
          const Icon = item.icon

          if (item.comingSoon) {
            return (
              <button
                key={item.path}
                onClick={handleComingSoon}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground opacity-50 hover:opacity-70 transition-all"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                <span className="ml-auto text-[9px] bg-muted text-muted-foreground rounded px-1 py-0.5 font-medium">
                  SOON
                </span>
              </button>
            )
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User Info */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{fullName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
