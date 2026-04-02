import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  CalendarRange,
  BarChart3,
  Settings,
  Factory,
  FileSearch,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  comingSoon?: boolean
}

export interface RoleConfig {
  label: string
  badgeClass: string
  navItems: NavItem[]
}

const ALL_NAV: NavItem[] = [
  { label: 'Dashboard',      path: '/dashboard',   icon: LayoutDashboard },
  { label: 'Projects',       path: '/projects',    icon: FolderKanban },
  { label: 'Inspections',    path: '/inspections', icon: ClipboardCheck },
  { label: 'Planning',       path: '/planning',    icon: CalendarRange },
  { label: 'Factories',      path: '/factories',   icon: Factory },
  { label: 'Factory Audits', path: '/audits/factory', icon: FileSearch },
  { label: 'Analytics',      path: '/analytics',   icon: BarChart3 },
  { label: 'Settings',       path: '/settings',    icon: Settings },
]

const nav = (...labels: string[]): NavItem[] =>
  ALL_NAV.filter((i) => labels.includes(i.label))

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    navItems: ALL_NAV,
  },
  brand_manager: {
    label: 'Brand Manager',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    navItems: nav('Dashboard', 'Projects', 'Inspections', 'Planning', 'Factories', 'Factory Audits', 'Analytics', 'Settings'),
  },
  factory_manager: {
    label: 'Factory Manager',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    navItems: nav('Dashboard', 'Projects', 'Inspections', 'Planning', 'Factory Audits', 'Settings'),
  },
  inspector: {
    label: 'Inspector',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    navItems: nav('Dashboard', 'Inspections', 'Settings'),
  },
  viewer: {
    label: 'Viewer',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    navItems: nav('Dashboard', 'Analytics', 'Settings'),
  },
}
