'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Building2,
  Users,
  Clock,
  Search,
  Activity,
  Shield,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConsoleKpiCard } from '@/components/console/ConsoleKpiCard'
import { cn } from '@/lib/utils'
import { startImpersonationSession, getUserActivity, getUserActivityStats } from '../actions'

/* ─── TYPES ─── */

interface UserRow {
  id: string
  full_name: string
  email: string
  role: string
  org_id: string | null
  orgName: string
  is_active: boolean
  lastLogin: string | null
  created_at: string
}

interface ActivityRow {
  id: string
  action_type: string
  category: string
  action_label: string
  detail: string | null
  created_at: string
}

interface Props {
  users: UserRow[]
  orgs: { id: string; name: string }[]
  totalOrgs: number
  totalUsers: number
  sessionsToday: number
}

/* ─── CONSTANTS ─── */

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  brand_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  factory_manager: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  inspector: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  inspections: { bg: '#E1F5EE', text: '#085041' },
  create: { bg: '#E6F1FB', text: '#0C447C' },
  edit: { bg: '#E6F1FB', text: '#0C447C' },
  delete: { bg: '#FCEBEB', text: '#791F1F' },
  navigation: { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' },
  auth: { bg: '#EEEDFE', text: '#3C3489' },
  team: { bg: '#E1F5EE', text: '#085041' },
  billing: { bg: '#FAEEDA', text: '#633806' },
  templates: { bg: '#FAEEDA', text: '#633806' },
  projects: { bg: '#E6F1FB', text: '#0C447C' },
  factories: { bg: '#FAEEDA', text: '#633806' },
  settings: { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' },
}

const ALL_ROLES = [
  { value: 'brand_manager', label: 'Brand Manager' },
  { value: 'factory_manager', label: 'Factory Manager' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'viewer', label: 'Viewer' },
]

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/* ─── COMPONENT ─── */

export function ImpersonateClient({ users, orgs, totalOrgs, totalUsers, sessionsToday }: Props) {
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [search, setSearch] = useState('')
  const [filterOrg, setFilterOrg] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [pending, startTransition] = useTransition()

  // Detail view state
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [activityStats, setActivityStats] = useState({ totalActions: 0, sessions: 0, inspections: 0, deletions: 0 })
  const [filterAction, setFilterAction] = useState('all')
  const [loadingActivity, setLoadingActivity] = useState(false)

  // Load activity when user selected
  useEffect(() => {
    if (!selectedUser) return
    setLoadingActivity(true)
    Promise.all([
      getUserActivity(selectedUser.id, filterAction !== 'all' ? filterAction : undefined),
      getUserActivityStats(selectedUser.id),
    ]).then(([acts, stats]) => {
      setActivity(acts)
      setActivityStats(stats)
    }).finally(() => setLoadingActivity(false))
  }, [selectedUser, filterAction])

  const filtered = users.filter(u => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (filterOrg !== 'all' && u.org_id !== filterOrg) return false
    if (filterRole !== 'all' && u.role !== filterRole) return false
    return true
  })

  const handleViewAs = (user: UserRow) => {
    startTransition(async () => {
      try {
        const sessionId = await startImpersonationSession(
          user.id, user.email, user.full_name, user.orgName,
        )
        sessionStorage.setItem('impersonating', JSON.stringify({
          sessionId,
          targetUserId: user.id,
          targetUserName: user.full_name,
          targetOrgName: user.orgName,
          targetRole: user.role,
          startedAt: new Date().toISOString(),
        }))
        window.location.href = '/dashboard'
      } catch {
        toast.error('Failed to start impersonation session')
      }
    })
  }

  /* ─── DETAIL VIEW ─── */
  if (selectedUser) {
    return (
      <div>
        {/* Back + header */}
        <button onClick={() => { setSelectedUser(null); setFilterAction('all') }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={14} /> All users
        </button>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {selectedUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{selectedUser.full_name}</h2>
                <Badge className={ROLE_BADGE[selectedUser.role] ?? ROLE_BADGE.viewer}>
                  {selectedUser.role.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedUser.orgName} &middot; {selectedUser.email} &middot; Last active {timeAgo(selectedUser.lastLogin)}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleViewAs(selectedUser)}
            disabled={pending}
            className="gap-1.5 text-xs"
            style={{ backgroundColor: '#FAEEDA', color: '#633806', border: '1px solid #FAC775' }}
          >
            View as user <ArrowRight size={14} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <ConsoleKpiCard title="Total Actions" value={activityStats.totalActions} icon={Activity} />
          <ConsoleKpiCard title="Sessions" value={activityStats.sessions} icon={Clock} />
          <ConsoleKpiCard title="Inspections" value={activityStats.inspections} icon={Shield} />
          <ConsoleKpiCard title="Deletions" value={activityStats.deletions} icon={Trash2} className={activityStats.deletions > 0 ? 'border-red-200 dark:border-red-900/30' : ''} />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {['all', 'login', 'navigation', 'create', 'edit', 'delete', 'inspection_start', 'template_create', 'invite_member'].map(f => (
            <button
              key={f}
              onClick={() => setFilterAction(f)}
              className={cn(
                'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
                filterAction === f
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loadingActivity ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading activity...</div>
          ) : activity.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No activity recorded yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {activity.map((act, i) => {
                const colors = CATEGORY_COLORS[act.category] ?? CATEGORY_COLORS.navigation
                return (
                  <div key={act.id} className="flex items-center gap-1.5 px-3 py-2 overflow-hidden" style={{ whiteSpace: 'nowrap' }}>
                    {/* Node dot */}
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.text}20` }} />
                    {/* Category badge */}
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: colors.bg, color: colors.text }}>
                      {act.category}
                    </span>
                    {/* Action label */}
                    <span className="text-[11px] font-medium text-foreground shrink-0">{act.action_label}</span>
                    {/* Detail */}
                    {act.detail && (
                      <>
                        <span className="text-[10px] text-muted-foreground shrink-0">&middot;</span>
                        <span className="text-[10px] text-muted-foreground overflow-hidden text-ellipsis flex-1 min-w-0">{act.detail}</span>
                      </>
                    )}
                    {/* Time */}
                    <span className="text-[9px] text-muted-foreground shrink-0 ml-auto pl-2">{timeAgo(act.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ─── LIST VIEW ─── */
  return (
    <div>
      {/* Warning */}
      <div className="rounded-lg border px-4 py-3 mb-6 flex items-start gap-3 text-xs" style={{ borderColor: '#FAC775', backgroundColor: 'rgba(250,199,117,0.08)' }}>
        <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: '#BA7517' }} />
        <span className="text-muted-foreground">
          You are <strong className="text-foreground">Super Admin</strong>. Impersonation sessions are recorded. The user is not notified.
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <ConsoleKpiCard title="Total Organisations" value={totalOrgs} icon={Building2} />
        <ConsoleKpiCard title="Total Users" value={totalUsers} icon={Users} />
        <ConsoleKpiCard title="Sessions Today" value={sessionsToday} icon={Clock} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 w-[200px] text-xs rounded-full"
          />
        </div>
        <Select value={filterOrg} onValueChange={setFilterOrg}>
          <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs rounded-full"><SelectValue placeholder="All Orgs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Orgs</SelectItem>
            {orgs.map(o => <SelectItem key={o.id} value={o.id} className="text-xs">{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs rounded-full"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Roles</SelectItem>
            {ALL_ROLES.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} users</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Organisation</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Last Login</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">No users found.</td></tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{user.full_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[150px]">{user.orgName}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-[10px]', ROLE_BADGE[user.role] ?? ROLE_BADGE.viewer)}>
                        {user.role.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(user.lastLogin)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('w-1.5 h-1.5 rounded-full', user.is_active ? 'bg-emerald-500' : 'bg-gray-400')} />
                        <span className="text-xs text-muted-foreground">{user.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-[10px] h-7 px-2"
                        style={{ color: '#C9A96E' }}
                        onClick={e => { e.stopPropagation(); handleViewAs(user) }}
                        disabled={pending}
                      >
                        View as user <ArrowRight size={12} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
