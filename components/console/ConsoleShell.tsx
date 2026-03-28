'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, ChevronRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConsoleSidebar } from '@/components/console/ConsoleSidebar'

interface ConsoleShellProps {
  fullName: string
  email: string
  children: React.ReactNode
}

export function ConsoleShell({ fullName, email, children }: ConsoleShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const segments = pathname.replace('/console', '').split('/').filter(Boolean)
  const currentPage = segments.length > 0
    ? segments[segments.length - 1].replace(/-/g, ' ')
    : 'Overview'

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-60 flex-shrink-0 flex-col">
        <ConsoleSidebar fullName={fullName} email={email} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 flex flex-col z-10">
            <ConsoleSidebar fullName={fullName} email={email} onNavClick={() => setSidebarOpen(false)} />
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
            <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A96E' }} />
            <span className="hidden sm:inline" style={{ color: '#C9A96E' }}>Founder Console</span>
            <ChevronRight className="w-3 h-3 hidden sm:inline flex-shrink-0" />
            <span className="font-medium text-foreground capitalize truncate">{currentPage}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
