'use client'

import { useState } from 'react'
import { Activity, Users, Trash2, Shield, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConsoleKpiCard } from '@/components/console/ConsoleKpiCard'
import { cn } from '@/lib/utils'

/* ─── TYPES ─── */

interface ActivityRow {
  id: string
  userId: string
  userName: string
  userRole: string
  orgName: string
  actionType: string
  category: string
  actionLabel: string
  detail: string | null
  createdAt: string
}

interface Props {
  activity: ActivityRow[]
  stats: { eventsToday: number; activeUsersToday: number; deletionsToday: number; inspectionsToday: number }
  users: { id: string; name: string }[]
  orgs: { id: string; name: string }[]
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

const ACTION_TYPES = [
  { value: 'login', label: 'Login / Logout' },
  { value: 'create', label: 'Create' },
  { value: 'edit', label: 'Edit' },
  { value: 'delete', label: 'Delete' },
  { value: 'inspection_start', label: 'Inspection' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'template_create', label: 'Template' },
  { value: 'invite_member', label: 'Invite' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

/* ─── COMPONENT ─── */

export function ActivityClient({ activity, stats, users, orgs }: Props) {
  const [search, setSearch] = useState('')
  const [filterUser, setFilterUser] = useState('all')
  const [filterOrg, setFilterOrg] = useState('all')
  const [filterAction, setFilterAction] = useState('all')
  const [visibleCount, setVisibleCount] = useState(50)

  const filtered = activity.filter(a => {
    if (search) {
      const q = search.toLowerCase()
      if (!a.actionLabel.toLowerCase().includes(q) && !(a.detail ?? '').toLowerCase().includes(q)) return false
    }
    if (filterUser !== 'all' && a.userId !== filterUser) return false
    if (filterOrg !== 'all' && a.orgName !== filterOrg) return false
    if (filterAction !== 'all' && !a.actionType.includes(filterAction)) return false
    return true
  })

  const visible = filtered.slice(0, visibleCount)

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ConsoleKpiCard title="Events Today" value={stats.eventsToday} icon={Activity} />
        <ConsoleKpiCard title="Active Users Today" value={stats.activeUsersToday} icon={Users} />
        <ConsoleKpiCard title="Deletions Today" value={stats.deletionsToday} icon={Trash2} className={stats.deletionsToday > 0 ? 'border-red-200 dark:border-red-900/30' : ''} />
        <ConsoleKpiCard title="Inspections Today" value={stats.inspectionsToday} icon={Shield} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search actions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 w-[180px] text-xs rounded-full" />
        </div>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs rounded-full"><SelectValue placeholder="All Users" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Users</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOrg} onValueChange={setFilterOrg}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs rounded-full"><SelectValue placeholder="All Orgs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Orgs</SelectItem>
            {orgs.map(o => <SelectItem key={o.id} value={o.id} className="text-xs">{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs rounded-full"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Actions</SelectItem>
            {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} events</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Detail</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No activity recorded yet.</td></tr>
              ) : (
                visible.map(a => {
                  const colors = CATEGORY_COLORS[a.category] ?? CATEGORY_COLORS.navigation
                  return (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                            {a.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[120px]">{a.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{a.actionLabel}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.bg, color: colors.text }}>
                          {a.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground truncate max-w-[250px]">{a.detail ?? '—'}</td>
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground text-right whitespace-nowrap">{timeAgo(a.createdAt)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load more */}
      {visibleCount < filtered.length && (
        <div className="text-center mt-4">
          <button onClick={() => setVisibleCount(prev => prev + 50)} className="text-xs text-primary hover:underline">
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}
