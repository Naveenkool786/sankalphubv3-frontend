'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users, Plus, MoreHorizontal, Mail, Copy, Trash2,
  ShieldCheck, Clock, UserX, Loader2, AlertTriangle, Lock,
} from 'lucide-react'
import { inviteUser, removeUser, updateUserRole, revokeInvite } from '../actions'
import type { UserRole } from '@/lib/getUserContext'
import type { SeatStatus } from '@/lib/planGuard'
import Link from 'next/link'

export interface MemberRow {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  invite_token: string | null
  invite_accepted_at: string | null
  invited_by_name: string | null
  created_at: string
}

interface Props {
  members: MemberRow[]
  pendingInvites: MemberRow[]
  canManage: boolean
  currentUserId: string
  seatStatus: SeatStatus
}

type OrgRole = Exclude<UserRole, 'super_admin'>

const ROLE_OPTIONS: { value: OrgRole; label: string; badgeClass: string }[] = [
  { value: 'brand_manager',   label: 'Brand Manager',   badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'factory_manager', label: 'Factory Manager', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'inspector',       label: 'Inspector',       badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'viewer',          label: 'Viewer',          badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
]

function getRoleConfig(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role) ?? ROLE_OPTIONS[ROLE_OPTIONS.length - 1]
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function UsersClient({ members, pendingInvites, canManage: isAdmin, currentUserId, seatStatus }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('inspector')
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ token: string } | null>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // Seat logic derived from seatStatus
  const isAtHardLimit = seatStatus.atLimit && seatStatus.extraSeatCostUsd === 0
  const isEnterpriseOverage = seatStatus.atLimit && seatStatus.extraSeatCostUsd > 0
  const seatPct = Math.min(100, Math.round((seatStatus.current / seatStatus.max) * 100))
  const seatBarColor = seatStatus.atLimit ? '#ef4444' : seatPct >= 80 ? '#f59e0b' : '#C9A96E'

  function resetInviteDialog() {
    setEmail('')
    setInviteRole('inspector')
    setInviteResult(null)
  }

  async function handleInvite() {
    if (!email.trim()) return
    setInviting(true)
    try {
      const result = await inviteUser(email.trim(), inviteRole)
      setInviteResult({ token: result.token })
      setEmail('')
      toast.success('Invitation created')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from your organization?`)) return
    try {
      await removeUser(userId)
      toast.success('Member removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  async function handleRoleChange(userId: string, role: OrgRole) {
    try {
      await updateUserRole(userId, role)
      toast.success('Role updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  async function handleRevoke(userId: string) {
    if (!confirm('Revoke this invitation?')) return
    try {
      await revokeInvite(userId)
      toast.success('Invitation revoked')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke invitation')
    }
  }

  function copyInviteLink(token: string) {
    const url = `${appUrl}/onboarding?invite=${token}`
    navigator.clipboard.writeText(url).catch(() => {})
    toast.success('Invite link copied')
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users &amp; Roles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage organization members and invitations</p>
        </div>

        {isAdmin && !isAtHardLimit && (
          <Button size="sm" className="gap-2" onClick={() => { resetInviteDialog(); setInviteOpen(true) }}>
            <Plus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* ── Seat Usage Bar ── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {seatStatus.current} / {seatStatus.max} seats used
            </span>
            <Badge
              className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground font-medium"
            >
              {seatStatus.planName}
            </Badge>
          </div>
          {isAtHardLimit ? (
            <Link
              href="/pricing"
              className="text-xs font-semibold hover:underline"
              style={{ color: '#A87C30' }}
            >
              Upgrade plan →
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">{seatStatus.max - seatStatus.current} remaining</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${seatPct}%`, backgroundColor: seatBarColor }}
          />
        </div>

        {/* Domain restriction notice */}
        {seatStatus.isDomainLocked && seatStatus.orgDomain && (
          <p className="text-xs text-muted-foreground">
            Domain-restricted — only <strong className="text-foreground">@{seatStatus.orgDomain}</strong> emails can be invited
            (PremiumHub Group plan).
          </p>
        )}

        {/* Enterprise overage notice */}
        {isEnterpriseOverage && isAdmin && (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              You have reached the 11-seat base limit. Adding more users will incur an additional{' '}
              <strong>${seatStatus.extraSeatCostUsd}/month per seat</strong>.
            </span>
          </div>
        )}

        {/* Hard limit notice with upgrade prompt */}
        {isAtHardLimit && isAdmin && (
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-start gap-2 text-xs text-red-500">
              <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Seat limit reached. Upgrade your plan to invite more members.</span>
            </div>
            <Button asChild size="sm" style={{ backgroundColor: '#A87C30' }} className="hover:opacity-90 flex-shrink-0 text-white">
              <Link href="/pricing">Upgrade</Link>
            </Button>
          </div>
        )}
      </div>

      {/* ── Members Card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
            <Badge className="ml-1 text-[10px] px-1.5 bg-muted text-muted-foreground">{members.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No active members yet. Invite your team to get started.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => {
                const rc = getRoleConfig(m.role)
                const name = m.full_name || m.email.split('@')[0] || 'Unknown'
                const isMe = m.id === currentUserId
                return (
                  <div key={m.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {name}
                        {isMe && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                    <Badge className={cn('text-[10px] px-2 py-0.5', rc.badgeClass)}>{rc.label}</Badge>
                    {isAdmin && !isMe && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Change Role</div>
                          {ROLE_OPTIONS.map((ro) => (
                            <DropdownMenuItem
                              key={ro.value}
                              onClick={() => handleRoleChange(m.id, ro.value)}
                              className={cn('text-xs', m.role === ro.value && 'bg-accent')}
                            >
                              {ro.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs text-red-600 focus:text-red-600"
                            onClick={() => handleRemove(m.id, name)}
                          >
                            <UserX className="w-3.5 h-3.5 mr-2" />
                            Remove member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Pending Invitations ── */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Pending Invitations
              {pendingInvites.length > 0 && (
                <Badge className="ml-1 text-[10px] px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pendingInvites.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pendingInvites.length === 0 ? (
              <div className="px-6 py-4 text-sm text-muted-foreground">No pending invitations.</div>
            ) : (
              <div className="divide-y divide-border">
                {pendingInvites.map((inv) => {
                  const rc = getRoleConfig(inv.role)
                  return (
                    <div key={inv.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/20 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited on {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={cn('text-[10px] px-2 py-0.5', rc.badgeClass)}>{rc.label}</Badge>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {inv.invite_token && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            title="Copy invite link"
                            onClick={() => copyInviteLink(inv.invite_token!)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600"
                          title="Revoke invitation"
                          onClick={() => handleRevoke(inv.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Invite Dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) resetInviteDialog() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Invite a Team Member</DialogTitle>
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Invitation sent! Share this link:
                </p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                <code className="text-xs truncate flex-1 text-muted-foreground">
                  {`${appUrl}/onboarding?invite=${inviteResult.token}`}
                </code>
                <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => copyInviteLink(inviteResult.token)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <DialogFooter>
                <Button size="sm" onClick={resetInviteDialog}>Invite Another</Button>
                <Button size="sm" variant="secondary" onClick={() => setInviteOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Enterprise overage warning in dialog */}
              {isEnterpriseOverage && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    You are over the 11-seat base limit. Adding this user will add{' '}
                    <strong>${seatStatus.extraSeatCostUsd}/month</strong> to your Enterprise bill.
                  </span>
                </div>
              )}

              {/* Domain restriction hint */}
              {seatStatus.isDomainLocked && seatStatus.orgDomain && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-xs text-muted-foreground bg-muted border border-border">
                  <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Only <strong className="text-foreground">@{seatStatus.orgDomain}</strong> email addresses can be invited on your Group plan.
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email Address</label>
                <Input
                  type="email"
                  placeholder={seatStatus.isDomainLocked && seatStatus.orgDomain ? `colleague@${seatStatus.orgDomain}` : 'colleague@company.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9"
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  disabled={inviting}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((ro) => (
                    <button
                      key={ro.value}
                      onClick={() => setInviteRole(ro.value)}
                      disabled={inviting}
                      className={cn(
                        'p-2.5 rounded-lg border-2 text-left text-xs font-medium transition-all',
                        inviteRole === ro.value
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border text-muted-foreground hover:border-border/80'
                      )}
                    >
                      {ro.label}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" size="sm" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancel</Button>
                <Button size="sm" disabled={!email.trim() || inviting} onClick={handleInvite}>
                  {inviting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Creating...</> : 'Send Invite'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
