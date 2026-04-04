'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Plus, Search, MapPin, MoreHorizontal, Building2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { assignFactoryToProject, updateFactoryStatus } from '../actions'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database'

interface FactoryRow {
  id: string; name: string; code: string | null; country: string | null; city: string | null
  contact_name: string | null; contact_email: string | null; contact_phone: string | null
  certifications: string[] | null; is_active: boolean; created_at: string
  photo_url?: string | null; latest_audit_score?: number | null; latest_audit_date?: string | null
  latest_audit_result?: string | null; status: string; utilisation_pct?: number
  total_lines?: number; active_lines?: number; pass_rate?: number; passRate: number
  activeOrders: number; max_capacity?: number | null
}

interface ProjectRow { id: string; name: string; factory_id: string | null; status: string }

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string; border: string }> = {
  active:       { bg: '#E1F5EE', color: '#085041', label: 'Active', border: '#1D9E75' },
  at_capacity:  { bg: '#FCEBEB', color: '#791F1F', label: 'At capacity', border: '#E24B4A' },
  under_review: { bg: '#EEEDFE', color: '#3C3489', label: 'Under review', border: '#534AB7' },
  inactive:     { bg: 'var(--muted)', color: 'var(--muted-foreground)', label: 'Inactive', border: '#888780' },
}

const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'At capacity', value: 'at_capacity' },
  { label: 'Under review', value: 'under_review' },
  { label: 'Audited', value: 'audited' },
  { label: 'Inactive', value: 'inactive' },
]


function isDraftFactory(f: FactoryRow): boolean {
  return !f.country || !f.contact_name || !f.contact_email
}

function getMissingFields(f: FactoryRow): string {
  const missing: string[] = []
  if (!f.country) missing.push('country')
  if (!f.contact_name) missing.push('contact name')
  if (!f.contact_email) missing.push('contact email')
  if (!f.total_lines) missing.push('production lines')
  if (missing.length === 0) return 'Review and confirm'
  return `Missing: ${missing.join(', ')}`
}

interface Props { factories: FactoryRow[]; projects: ProjectRow[]; userRole: UserRole; orgId?: string }

export function FactoriesClient({ factories, projects, userRole, orgId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [assignDialog, setAssignDialog] = useState<FactoryRow | null>(null)
  const [selectedProject, setSelectedProject] = useState('')
  const [pending, startTransition] = useTransition()

  const canAdd = ['super_admin', 'brand_manager'].includes(userRole)

  const filtered = useMemo(() => {
    return factories.filter(f => {
      if (search) {
        const q = search.toLowerCase()
        if (!f.name.toLowerCase().includes(q) && !(f.country || '').toLowerCase().includes(q) && !(f.city || '').toLowerCase().includes(q)) return false
      }
      if (filter === 'all') return true
      if (filter === 'audited') return f.latest_audit_score != null
      return f.status === filter
    })
  }, [factories, search, filter])

  const stats = useMemo(() => ({
    active: factories.filter(f => f.status === 'active').length,
    atCapacity: factories.filter(f => f.status === 'at_capacity').length,
    underReview: factories.filter(f => f.status === 'under_review').length,
  }), [factories])

  const unassignedProjects = projects.filter(p => !p.factory_id && p.status !== 'cancelled')

  // Photo upload
  const handlePhotoUpload = (factoryId: string) => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
      try {
        const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const path = `${orgId || 'uploads'}/${factoryId}/photo.jpg`
        const { data } = await supabase.storage.from('factory-photos').upload(path, file, { upsert: true })
        if (data) {
          const url = supabase.storage.from('factory-photos').getPublicUrl(data.path).data.publicUrl
          await (supabase.from('factories') as any).update({ photo_url: url }).eq('id', factoryId)
          router.refresh()
          toast.success('Photo uploaded')
        }
      } catch { toast.error('Failed to upload photo') }
    }
    input.click()
  }

  const handleDeactivate = async (factory: FactoryRow) => {
    const newStatus = factory.status === 'inactive' ? 'active' : 'inactive'
    try {
      await updateFactoryStatus(factory.id, newStatus)
      toast.success(`Factory ${newStatus === 'inactive' ? 'deactivated' : 'activated'}`)
    } catch (err: any) { toast.error(err?.message || 'Failed') }
  }

  function handleAssign() {
    if (!assignDialog || !selectedProject) return
    startTransition(async () => {
      try {
        await assignFactoryToProject(assignDialog.id, selectedProject)
        toast.success('Factory assigned')
        setAssignDialog(null); setSelectedProject('')
      } catch (err: any) { toast.error(err?.message || 'Failed') }
    })
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Factories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {factories.length} factor{factories.length !== 1 ? 'ies' : 'y'}
            {stats.active > 0 && <> &middot; {stats.active} active</>}
            {stats.atCapacity > 0 && <> &middot; {stats.atCapacity} at capacity</>}
            {stats.underReview > 0 && <> &middot; {stats.underReview} under review</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAdd && (
            <Button variant="outline" size="sm" onClick={() => router.push('/audits/factory/new')}>
              + New audit
            </Button>
          )}
          {canAdd && (
            <Button size="sm" onClick={() => router.push('/factories/new')}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Factory
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search factories..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTER_TABS.map(t => (
            <Button key={t.value} variant={filter === t.value ? 'default' : 'outline'} size="sm"
              className={cn('text-xs', filter !== t.value && 'text-muted-foreground')}
              onClick={() => setFilter(t.value)}>
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No factories found</h3>
          <p className="text-sm text-muted-foreground mb-6">Add your first manufacturing partner.</p>
          {canAdd && <Button onClick={() => router.push('/factories/new')}><Plus className="w-4 h-4 mr-1.5" /> Add Factory</Button>}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(factory => {
            const sc = STATUS_CONFIG[factory.status] || STATUS_CONFIG.active
            const utilPct = factory.utilisation_pct ?? (factory.total_lines ? Math.round(((factory.active_lines ?? 0) / factory.total_lines) * 100) : 0)
            const utilColor = utilPct >= 100 ? '#E24B4A' : utilPct >= 80 ? '#BA7517' : '#1D9E75'

            return (
              <div key={factory.id} className="bg-card border border-border overflow-hidden hover:shadow-md transition-shadow group"
                style={{ borderLeft: `3px solid ${sc.border}`, borderRadius: '0 10px 10px 0' }}>

                {/* Photo area */}
                <div style={{ position: 'relative', height: '120px', overflow: 'hidden' }}>
                  {factory.photo_url ? (
                    <>
                      <img src={factory.photo_url} alt={factory.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => handlePhotoUpload(factory.id)}
                          style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '6px', background: '#fff', color: '#111', border: 'none', cursor: 'pointer' }}>
                          Change photo
                        </button>
                      </div>
                    </>
                  ) : (
                    <div onClick={() => handlePhotoUpload(factory.id)}
                      style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--muted)', cursor: 'pointer' }}>
                      <Camera className="w-6 h-6" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                      <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Click to upload photo</span>
                    </div>
                  )}
                  {/* Status pill */}
                  <span className="absolute top-2 left-2" style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '5px', fontWeight: 600, background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                  {/* Menu */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/80 rounded-full">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem asChild><Link href={`/factories/${factory.id}`}>View factory</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePhotoUpload(factory.id)}>
                          {factory.photo_url ? 'Change photo' : 'Upload photo'}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/audits/factory/new?factoryId=${factory.id}`}>New audit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/audits/factory?factoryId=${factory.id}`}>View audit history</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {canAdd && unassignedProjects.length > 0 && (
                          <DropdownMenuItem onClick={() => { setAssignDialog(factory); setSelectedProject('') }}>Assign to project</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeactivate(factory)}>
                          {factory.status === 'inactive' ? 'Activate' : 'Deactivate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '10px 12px 12px' }}>
                  <Link href={`/factories/${factory.id}`} className="block">
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }} className="truncate">{factory.name}</p>
                  </Link>

                  {/* Audit score row */}
                  {factory.latest_audit_score != null ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '5px 8px', borderRadius: '6px', marginTop: '6px', marginBottom: '6px',
                      background: factory.latest_audit_result === 'failed' ? '#FCEBEB' : 'var(--muted)',
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>Factory audit score</div>
                        {factory.latest_audit_date && (
                          <div style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>
                            {new Date(factory.latest_audit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '14px', fontWeight: 500,
                          color: factory.latest_audit_score >= 75 ? '#085041' : factory.latest_audit_score >= 50 ? '#BA7517' : '#E24B4A',
                        }}>
                          {factory.latest_audit_score}%
                        </span>
                        <span style={{
                          fontSize: '9px', padding: '2px 6px', borderRadius: '5px', fontWeight: 500,
                          background: factory.latest_audit_score >= 75 ? '#E1F5EE' : factory.latest_audit_score >= 50 ? '#FAEEDA' : '#FCEBEB',
                          color: factory.latest_audit_score >= 75 ? '#085041' : factory.latest_audit_score >= 50 ? '#633806' : '#791F1F',
                        }}>
                          {factory.latest_audit_result === 'approved' ? 'Approved' : factory.latest_audit_result === 'conditional' ? 'Conditional' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '5px 8px', background: 'var(--muted)', borderRadius: '6px', fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '6px', marginBottom: '6px' }}>
                      No audit yet &mdash;{' '}
                      <Link href={`/audits/factory/new?factoryId=${factory.id}`} style={{ color: '#BA7517', cursor: 'pointer' }}>
                        Schedule audit &rarr;
                      </Link>
                    </div>
                  )}

                  {/* Failed banner */}
                  {factory.latest_audit_result === 'failed' && (
                    <div style={{ padding: '5px 8px', background: '#FCEBEB', borderRadius: '6px', fontSize: '10px', color: '#791F1F', marginBottom: '6px' }}>
                      Re-audit required &mdash; no new orders until passed
                    </div>
                  )}

                  {/* Utilisation bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '3px' }}>
                    <span>Utilisation</span>
                    <span style={{ color: utilPct >= 100 ? '#E24B4A' : 'inherit' }}>
                      {factory.active_lines ?? 0}/{factory.total_lines ?? 4} lines{utilPct >= 100 ? ' \u2014 Full' : ''}
                    </span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--muted)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ width: `${Math.min(utilPct, 100)}%`, height: '100%', background: utilColor, borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>

                  {/* KPI boxes */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    {[
                      { val: factory.activeOrders, label: 'Active orders' },
                      { val: `${factory.passRate || 0}%`, label: 'Pass rate', color: (factory.passRate || 0) >= 90 ? '#1D9E75' : '#BA7517' },
                      { val: factory.total_lines ?? 4, label: 'Lines' },
                    ].map((kpi, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center', padding: '5px', background: 'var(--muted)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: (kpi as any).color || 'var(--foreground)' }}>{kpi.val}</div>
                        <div style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>{kpi.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Certifications */}
                  {(() => {
                    const raw = factory.certifications as any
                    const certs: string[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',').map((s: string) => s.trim()).filter(Boolean) : []
                    return certs.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {certs.map(cert => (
                          <span key={cert} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '5px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                            {cert}
                          </span>
                        ))}
                      </div>
                    ) : null
                  })()}

                  {/* Footer */}
                  {isDraftFactory(factory) ? (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>
                        {getMissingFields(factory)}
                      </span>
                      <button onClick={e => { e.stopPropagation(); router.push(`/factories/new?draftId=${factory.id}`) }}
                        style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '6px', background: '#FAEEDA', color: '#633806', border: '0.5px solid #C9A96E', cursor: 'pointer', fontWeight: 500 }}>
                        Continue &rarr;
                      </button>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted-foreground)' }}>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {[factory.city, factory.country].filter(Boolean).join(', ') || '\u2014'}
                      </span>
                      {factory.activeOrders > 0 && <span>{factory.activeOrders} active orders</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Dialogs (kept from original) ── */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign {assignDialog?.name} to Project</DialogTitle></DialogHeader>
          <div className="py-4">
            {unassignedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unassigned projects available.</p>
            ) : (
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>{unassignedProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedProject || pending}>{pending ? 'Assigning...' : 'Assign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

