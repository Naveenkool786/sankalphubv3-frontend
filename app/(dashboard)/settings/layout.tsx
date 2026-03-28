'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, FileText, Users, ShieldCheck, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNav = [
  { label: 'General', href: '/settings/general', icon: Settings },
  { label: 'Templates', href: '/settings/templates', icon: FileText },
  { label: 'Users & Roles', href: '/settings/users', icon: Users },
  { label: 'Permissions', href: '/settings/permissions', icon: ShieldCheck },
  { label: 'Billing', href: '/settings/billing', icon: CreditCard },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your organisation, team, and platform configuration
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left sub-nav */}
        <nav className="lg:w-52 flex-shrink-0">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href ||
                (item.href === '/settings/general' && pathname === '/settings')
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
