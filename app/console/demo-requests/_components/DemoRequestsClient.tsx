'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { updateDemoStatus } from '../actions'
import { toast } from 'sonner'

interface DemoRow {
  id: string
  role: string
  full_name: string
  company_name: string
  email: string
  phone: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const ROLE_BADGE: Record<string, string> = {
  factory: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  brand: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  agency: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  contacted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  converted: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

function getStatus(demo: DemoRow): string {
  return ((demo.metadata as any)?.status as string) ?? 'new'
}

export function DemoRequestsClient({ requests }: { requests: DemoRow[] }) {
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [detailDemo, setDetailDemo] = useState<DemoRow | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = requests.filter((d) => {
    if (filterRole !== 'all' && d.role !== filterRole) return false
    if (filterStatus !== 'all' && getStatus(d) !== filterStatus) return false
    return true
  })

  function handleStatusChange(demo: DemoRow, status: 'contacted' | 'converted') {
    startTransition(async () => {
      try {
        await updateDemoStatus(demo.id, status)
        toast.success(`Marked as ${status}`)
      } catch (err) {
        toast.error('Failed', { description: err instanceof Error ? err.message : 'Unknown error' })
      }
    })
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="factory">Factory</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center ml-auto">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          <div className="grid grid-cols-[1fr_1fr_1fr_100px_80px_90px_80px_40px] gap-3 px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
            <span>Name</span>
            <span>Company</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Role</span>
            <span>Date</span>
            <span>Status</span>
            <span></span>
          </div>

          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No demo requests found.</div>
          )}

          {filtered.map((demo) => {
            const status = getStatus(demo)
            return (
              <div key={demo.id} className="grid grid-cols-[1fr_1fr_1fr_100px_80px_90px_80px_40px] gap-3 px-4 py-3 items-center hover:bg-accent/30 transition-colors">
                <span className="text-xs font-medium text-foreground truncate">{demo.full_name}</span>
                <span className="text-xs text-muted-foreground truncate">{demo.company_name}</span>
                <span className="text-xs text-muted-foreground truncate">{demo.email}</span>
                <span className="text-[11px] text-muted-foreground">{demo.phone || '—'}</span>
                <Badge variant="secondary" className={cn('text-[10px] w-fit', ROLE_BADGE[demo.role])}>
                  {demo.role}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(demo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <Badge variant="secondary" className={cn('text-[10px] w-fit', STATUS_BADGE[status])}>
                  {status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDetailDemo(demo)}>
                      <Eye className="w-3.5 h-3.5 mr-2" /> View Details
                    </DropdownMenuItem>
                    {status !== 'contacted' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(demo, 'contacted')}>Mark Contacted</DropdownMenuItem>
                    )}
                    {status !== 'converted' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(demo, 'converted')}>Mark Converted</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailDemo} onOpenChange={() => setDetailDemo(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{detailDemo?.full_name}</SheetTitle>
          </SheetHeader>
          {detailDemo && (
            <div className="mt-6 space-y-4">
              <Detail label="Company" value={detailDemo.company_name} />
              <Detail label="Email" value={detailDemo.email} />
              <Detail label="Phone" value={detailDemo.phone || '—'} />
              <Detail label="Role" value={detailDemo.role} />
              <Detail label="Status" value={getStatus(detailDemo)} />
              <Detail label="Date" value={new Date(detailDemo.created_at).toLocaleString()} />
              {detailDemo.metadata && (
                <>
                  {(detailDemo.metadata as any).country && <Detail label="Country" value={(detailDemo.metadata as any).country} />}
                  {(detailDemo.metadata as any).product_focus && <Detail label="Product Focus" value={(detailDemo.metadata as any).product_focus} />}
                  {(detailDemo.metadata as any).team_size && <Detail label="Team Size" value={(detailDemo.metadata as any).team_size} />}
                  {(detailDemo.metadata as any).client_count && <Detail label="Clients" value={(detailDemo.metadata as any).client_count} />}
                  {(detailDemo.metadata as any).categories && (
                    <Detail label="Categories" value={(detailDemo.metadata as any).categories.join(', ')} />
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground mt-0.5">{value}</p>
    </div>
  )
}
