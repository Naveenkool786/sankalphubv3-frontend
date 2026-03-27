'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Menu, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/layout/Sidebar'
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
          <Button variant="ghost" size="icon" className="h-8 w-8 relative flex-shrink-0">
            <Bell className="w-4 h-4" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
