'use client'

import { PERMISSIONS, type Role } from '@/lib/permissions'
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const ROLES: { key: Role; label: string; badgeClass: string; description: string }[] = [
  {
    key: 'super_admin',
    label: 'Super Admin',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'Full access to all platform features, settings, billing, and team management.',
  },
  {
    key: 'brand_manager',
    label: 'Brand Manager',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Creates projects, manages factories, approves inspection reports, and views analytics.',
  },
  {
    key: 'factory_manager',
    label: 'Factory Manager',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    description: 'Manages factory profile, tracks inspections, and views assigned projects.',
  },
  {
    key: 'inspector',
    label: 'Inspector',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    description: 'Conducts inspections, logs defects, and submits reports.',
  },
  {
    key: 'viewer',
    label: 'Viewer',
    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    description: 'Read-only access to projects, inspections, and factory data.',
  },
]

const grouped = PERMISSIONS.reduce<Record<string, typeof PERMISSIONS>>((acc, p) => {
  if (!acc[p.category]) acc[p.category] = []
  acc[p.category].push(p)
  return acc
}, {})

export default function PermissionsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" /> Permissions
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Role-based access control for your organisation. Permissions are fixed and apply to all members with that role.
        </p>
      </div>

      {/* Role description cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {ROLES.map((role) => (
          <div key={role.key} className="p-4 rounded-xl border border-border bg-card">
            <Badge className={`${role.badgeClass} mb-2`}>{role.label}</Badge>
            <p className="text-xs text-muted-foreground">{role.description}</p>
          </div>
        ))}
      </div>

      {/* Permission matrix table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-64">Permission</th>
                {ROLES.map((role) => (
                  <th key={role.key} className="text-center px-3 py-3">
                    <Badge className={`${role.badgeClass} text-[10px]`}>{role.label}</Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([category, permissions]) => (
                <CategoryRows key={category} category={category} permissions={permissions} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        Permissions are managed at the organisation level and cannot be customised per user on the current plan.
      </p>
    </div>
  )
}

function CategoryRows({ category, permissions }: { category: string; permissions: typeof PERMISSIONS }) {
  return (
    <>
      <tr className="bg-muted/20 border-b border-t">
        <td colSpan={6} className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {category}
        </td>
      </tr>
      {permissions.map((permission) => (
        <tr key={permission.action} className="border-b last:border-0 hover:bg-accent/30 transition-colors">
          <td className="px-4 py-3">
            <p className="font-medium text-foreground text-xs">{permission.action}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{permission.description}</p>
          </td>
          {ROLES.map((role) => (
            <td key={role.key} className="text-center px-3 py-3">
              {permission.roles[role.key] ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 mx-auto" />
              ) : (
                <XCircle className="w-4.5 h-4.5 text-muted-foreground/20 mx-auto" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
