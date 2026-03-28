'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, Users as UsersIcon, UserCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ConsoleKpiCard } from '@/components/console/ConsoleKpiCard'
import { cn } from '@/lib/utils'
import { changeUserRole, toggleUserActive } from '../actions'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database'

interface UserRow {
  id: string
  full_name: string
  email: string
  role: string
  org_id: string | null
  orgName: string
  is_active: boolean
  lastLogin: string | null
  invite_token: string | null
  invite_accepted_at: string | null
  created_at: string
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  brand_manager: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  factory_manager: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  inspector: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  viewer: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
}

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'brand_manager', label: 'Brand Manager' },
  { value: 'factory_manager', label: 'Factory Manager' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'viewer', label: 'Viewer' },
]

interface Props {
  users: UserRow[]
  orgs: { id: string; name: string }[]
}

export function ConsoleUsersClient({ users, orgs }: Props) {
  const [filterRole, setFilterRole] = useState('all')
  const [filterOrg, setFilterOrg] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [roleDialogUser, setRoleDialogUser] = useState<UserRow | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [pending, startTransition] = useTransition()

  const activeCount = users.filter((u) => u.is_active).length
  const pendingInvites = users.filter((u) => u.invite_token && !u.invite_accepted_at).length

  const filtered = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false
    if (filterOrg !== 'all' && u.org_id !== filterOrg) return false
    if (filterStatus === 'active' && !u.is_active) return false
    if (filterStatus === 'inactive' && u.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      if (!u.full_name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    }
    return true
  })

  function handleChangeRole() {
    if (!roleDialogUser || !selectedRole) return
    startTransition(async () => {
      try {
        await changeUserRole(roleDialogUser.id, selectedRole as UserRole)
        toast.success('Role updated', { description: `${roleDialogUser.full_name} → ${selectedRole.replace('_', ' ')}` })
        setRoleDialogUser(null)
      } catch (err) {
        toast.error('Failed', { description: err instanceof Error ? err.message : 'Unknown error' })
      }
    })
  }

  function handleToggleActive(user: UserRow) {
    startTransition(async () => {
      try {
        await toggleUserActive(user.id, !user.is_active)
        toast.success(user.is_active ? 'User deactivated' : 'User reactivated')
      } catch (err) {
        toast.error('Failed', { description: err instanceof Error ? err.message : 'Unknown error' })
      }
    })
  }

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <ConsoleKpiCard title="Total Users" value={users.length} icon={UsersIcon} />
        <ConsoleKpiCard title="Active" value={activeCount} icon={UserCheck} />
        <ConsoleKpiCard title="Pending Invites" value={pendingInvites} icon={Clock} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[200px] h-9 text-xs"
        />
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ALL_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterOrg} onValueChange={setFilterOrg}>
          <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Organization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orgs</SelectItem>
            {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          <div className="grid grid-cols-[1fr_1fr_100px_120px_90px_80px_40px] gap-3 px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Organization</span>
            <span>Last Login</span>
            <span>Status</span>
            <span></span>
          </div>

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No users found.</div>
          )}

          {filtered.map((user) => {
            const initials = user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={user.id} className="grid grid-cols-[1fr_1fr_100px_120px_90px_80px_40px] gap-3 px-4 py-3 items-center hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                    {initials}
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">{user.full_name}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                <Badge variant="secondary" className={cn('text-[10px] w-fit', ROLE_BADGE[user.role] ?? ROLE_BADGE.viewer)}>
                  {user.role.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground truncate">{user.orgName}</span>
                <span className="text-[11px] text-muted-foreground">{timeAgo(user.lastLogin)}</span>
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', user.is_active ? 'bg-emerald-500' : 'bg-zinc-400')} />
                  <span className="text-[11px] text-muted-foreground">{user.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setRoleDialogUser(user); setSelectedRole(user.role) }}>Change Role</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                      {user.is_active ? 'Deactivate' : 'Reactivate'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={!!roleDialogUser} onOpenChange={() => setRoleDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role — {roleDialogUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogUser(null)}>Cancel</Button>
            <Button onClick={handleChangeRole} disabled={pending}>{pending ? 'Updating...' : 'Update Role'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
