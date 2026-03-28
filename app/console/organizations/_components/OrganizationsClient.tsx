'use client'

import { useState, useTransition } from 'react'
import { Building2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { getPlanDisplayName } from '@/lib/plans'
import { changePlan, toggleOrgActive } from '../actions'
import { toast } from 'sonner'

interface OrgRow {
  id: string
  name: string
  slug: string
  org_type: string
  plan: string
  max_users: number
  is_active: boolean
  trial_start: string | null
  trial_end: string | null
  created_at: string
  userCount: number
}

const TYPE_BADGE: Record<string, string> = {
  brand: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  factory: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  agency: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  trial: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  premium_single: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  premium_group: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  premium_enterprise: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  founding_member: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

const PLAN_OPTIONS = ['free', 'trial', 'premium_single', 'premium_group', 'premium_enterprise', 'founding_member']

export function OrganizationsClient({ orgs }: { orgs: OrgRow[] }) {
  const [filterType, setFilterType] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [planDialogOrg, setPlanDialogOrg] = useState<OrgRow | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [pending, startTransition] = useTransition()

  const now = new Date()

  const filtered = orgs.filter((o) => {
    if (filterType !== 'all' && o.org_type !== filterType) return false
    if (filterPlan !== 'all' && o.plan !== filterPlan) return false
    if (filterStatus === 'active' && !o.is_active) return false
    if (filterStatus === 'inactive' && o.is_active) return false
    if (filterStatus === 'trial' && o.plan !== 'trial') return false
    return true
  })

  function handleChangePlan() {
    if (!planDialogOrg || !selectedPlan) return
    startTransition(async () => {
      try {
        await changePlan(planDialogOrg.id, selectedPlan as any)
        toast.success('Plan updated', { description: `${planDialogOrg.name} → ${getPlanDisplayName(selectedPlan)}` })
        setPlanDialogOrg(null)
      } catch (err) {
        toast.error('Failed to update plan', { description: err instanceof Error ? err.message : 'Unknown error' })
      }
    })
  }

  function handleToggleActive(org: OrgRow) {
    startTransition(async () => {
      try {
        await toggleOrgActive(org.id, !org.is_active)
        toast.success(org.is_active ? 'Organization deactivated' : 'Organization reactivated')
      } catch (err) {
        toast.error('Failed to update', { description: err instanceof Error ? err.message : 'Unknown error' })
      }
    })
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Org Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
            <SelectItem value="factory">Factory</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {PLAN_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{getPlanDisplayName(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="trial">On Trial</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center ml-auto">
          {filtered.length} organization{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_120px_70px_100px_120px_100px_40px] gap-3 px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
            <span>Organization</span>
            <span>Type</span>
            <span>Plan</span>
            <span>Users</span>
            <span>Status</span>
            <span>Trial</span>
            <span>Created</span>
            <span></span>
          </div>

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No organizations found.</div>
          )}

          {filtered.map((org) => {
            const trialDaysLeft = org.trial_end
              ? Math.max(0, Math.ceil((new Date(org.trial_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
              : null

            return (
              <div key={org.id} className="grid grid-cols-[1fr_80px_120px_70px_100px_120px_100px_40px] gap-3 px-4 py-3 items-center text-sm hover:bg-accent/30 transition-colors">
                {/* Name */}
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate text-xs">{org.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{org.slug}</p>
                </div>
                {/* Type */}
                <Badge variant="secondary" className={cn('text-[10px] w-fit', TYPE_BADGE[org.org_type])}>
                  {org.org_type}
                </Badge>
                {/* Plan */}
                <Badge variant="secondary" className={cn('text-[10px] w-fit', PLAN_BADGE[org.plan] ?? PLAN_BADGE.free)}>
                  {getPlanDisplayName(org.plan)}
                </Badge>
                {/* Users */}
                <span className="text-xs text-foreground">{org.userCount}/{org.max_users}</span>
                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', org.is_active ? 'bg-emerald-500' : 'bg-zinc-400')} />
                  <span className="text-xs text-muted-foreground">{org.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                {/* Trial */}
                {org.plan === 'trial' && trialDaysLeft !== null ? (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', trialDaysLeft > 7 ? 'bg-emerald-500' : trialDaysLeft > 3 ? 'bg-amber-500' : 'bg-red-500')}
                        style={{ width: `${Math.min(100, (trialDaysLeft / 21) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{trialDaysLeft}d left</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
                {/* Created */}
                <span className="text-[11px] text-muted-foreground">
                  {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </span>
                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setPlanDialogOrg(org); setSelectedPlan(org.plan) }}>
                      Change Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(org)}>
                      {org.is_active ? 'Deactivate' : 'Reactivate'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan Change Dialog */}
      <Dialog open={!!planDialogOrg} onOpenChange={() => setPlanDialogOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan — {planDialogOrg?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>{getPlanDisplayName(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOrg(null)}>Cancel</Button>
            <Button onClick={handleChangePlan} disabled={pending}>
              {pending ? 'Updating...' : 'Update Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
