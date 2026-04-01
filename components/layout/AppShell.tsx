'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, ChevronRight, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import type { UserRole } from '@/types/database'

interface AppShellProps {
  role: UserRole
  orgName: string
  fullName: string
  email: string
  children: React.ReactNode
}

export function AppShell({ role, orgName, fullName, email, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const currentPage = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-60 flex-shrink-0 flex-col">
        <Sidebar role={role} orgName={orgName} fullName={fullName} email={email} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 flex flex-col z-10">
            <Sidebar
              role={role}
              orgName={orgName}
              fullName={fullName}
              email={email}
              onNavClick={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center gap-3 px-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex-1 flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <span className="hidden sm:inline truncate">{orgName}</span>
            <ChevronRight className="w-3 h-3 hidden sm:inline flex-shrink-0" />
            <span className="font-medium text-foreground capitalize truncate">{currentPage}</span>
          </div>
          {/* PremiumHub upgrade button */}
          <button
            className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold tracking-wide transition-all hover:opacity-90 flex-shrink-0"
            style={{
              backgroundColor: 'rgba(201,169,110,0.12)',
              color: '#C9A96E',
              border: '1px solid rgba(201,169,110,0.25)',
            }}
            title="Upgrade to PremiumHub"
          >
            <Crown className="w-3.5 h-3.5" />
            PremiumHub
          </button>
          <NotificationBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
