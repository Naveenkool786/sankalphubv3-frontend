'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { Factory, Plus, UserPlus, Search, SlidersHorizontal, MapPin, Shield, BarChart3, MoreVertical, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { createFactory, assignFactoryToProject } from '../actions'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database'

interface FactoryRow {
  id: string
  name: string
  code: string | null
  country: string | null
  city: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  certifications: string[] | null
  is_active: boolean
  created_at: string
  passRate: number | null
  totalInspections: number
}

interface ProjectRow {
  id: string
  name: string
  factory_id: string | null
  status: string
}

const CERT_OPTIONS = ['ISO 9001', 'GOTS', 'OEKO-TEX', 'BSCI', 'SA8000', 'WRAP', 'GRS']

interface Props {
  factories: FactoryRow[]
  projects: ProjectRow[]
  userRole: UserRole
}

export function FactoriesClient({ factories, projects, userRole }: Props) {
  const [search, setSearch] = useState('')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [assignDialog, setAssignDialog] = useState<FactoryRow | null>(null)
  const [selectedProject, setSelectedProject] = useState('')
  const [pending, startTransition] = useTransition()

  const canAdd = ['super_admin', 'brand_manager'].includes(userRole)
  const canSelfRegister = ['factory_manager', 'super_admin'].includes(userRole)

  const countries = useMemo(() => {
    const set = new Set<string>()
    factories.forEach((f) => { if (f.country) set.add(f.country) })
    return Array.from(set).sort()
  }, [factories])

  const filtered = useMemo(() => {
    return factories.filter((f) => {
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCountry !== 'all' && f.country !== filterCountry) return false
      if (filterStatus === 'active' && !f.is_active) return false
      if (filterStatus === 'inactive' && f.is_active) return false
      return true
    })
  }, [factories, search, filterCountry, filterStatus])

  function handleAssign() {
    if (!assignDialog || !selectedProject) return
    startTransition(async () => {
      try {
        await assignFactoryToProject(assignDialog.id, selectedProject)
        toast.success('Factory assigned', { description: `${assignDialog.name} assigned to project` })
        setAssignDialog(null)
        setSelectedProject('')
      } catch (err) {
        toast.error('Failed', { description: err instanceof Error ? err.message : 'Unknown error' })
      }
    })
  }

  const unassignedProjects = projects.filter((p) => !p.factory_id && p.status !== 'cancelled')

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Factory className="w-6 h-6 text-primary" />
            Factories
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor your manufacturing partners
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canSelfRegister && (
            <Button variant="outline" size="sm" onClick={() => setShowRegisterDialog(true)}>
              <UserPlus className="w-4 h-4 mr-1.5" /> Register My Factory
            </Button>
          )}
          {canAdd && (
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Factory
            </Button>
          )}
        </div>
      </div>

      {/* Filters — pill-shaped */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search factories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 rounded-full text-sm w-[180px]"
          />
        </div>
        <Select value={filterCountry} onValueChange={setFilterCountry}>
          <SelectTrigger className="h-8 px-3 rounded-full border text-sm w-auto min-w-[130px]">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 px-3 rounded-full border text-sm w-auto min-w-[120px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} factor{filtered.length !== 1 ? 'ies' : 'y'}</span>
      </div>

      {/* Factory Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No factories yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Add your first manufacturing partner or invite a factory to register.</p>
          {canAdd && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Factory
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((factory) => (
            <div key={factory.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-sm transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {factory.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{factory.name}</p>
                    {(factory.city || factory.country) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {[factory.city, factory.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', factory.is_active ? 'bg-emerald-500' : 'bg-zinc-400')} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/factories/${factory.id}`}>View Profile</Link>
                      </DropdownMenuItem>
                      {canAdd && unassignedProjects.length > 0 && (
                        <DropdownMenuItem onClick={() => { setAssignDialog(factory); setSelectedProject('') }}>
                          Assign to Project
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Certifications */}
              {factory.certifications && factory.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {(factory.certifications as string[]).slice(0, 3).map((cert) => (
                    <Badge key={cert} variant="secondary" className="text-[10px]">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />{cert}
                    </Badge>
                  ))}
                  {(factory.certifications as string[]).length > 3 && (
                    <Badge variant="secondary" className="text-[10px]">+{(factory.certifications as string[]).length - 3}</Badge>
                  )}
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> {factory.totalInspections} inspections
                </span>
              </div>

              {/* Pass Rate Progress Bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">Pass Rate</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all',
                      factory.passRate === null ? '' :
                      factory.passRate >= 80 ? 'bg-emerald-500' :
                      factory.passRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${factory.passRate ?? 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-10 text-right">
                  {factory.passRate !== null ? `${factory.passRate}%` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Factory Dialog */}
      <FactoryFormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Add Factory"
        submitLabel="Add Factory"
        isSelfRegister={false}
      />

      {/* Register My Factory Dialog */}
      <FactoryFormDialog
        open={showRegisterDialog}
        onClose={() => setShowRegisterDialog(false)}
        title="Register My Factory"
        submitLabel="Register"
        isSelfRegister={true}
      />

      {/* Assign to Project Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {assignDialog?.name} to Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {unassignedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unassigned projects available.</p>
            ) : (
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {unassignedProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedProject || pending}>
              {pending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ── Factory Form Dialog ── */
function FactoryFormDialog({
  open, onClose, title, submitLabel, isSelfRegister,
}: {
  open: boolean
  onClose: () => void
  title: string
  submitLabel: string
  isSelfRegister: boolean
}) {
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [code, setCode] = useState('')
  const [certs, setCerts] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function toggleCert(c: string) {
    setCerts((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
  }

  function resetForm() {
    setName(''); setCountry(''); setCity(''); setContactName('')
    setContactEmail(''); setContactPhone(''); setCode(''); setCerts([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await createFactory({
        name, country, city, contact_name: contactName,
        contact_email: contactEmail, contact_phone: contactPhone,
        code, certifications: certs, is_self_registered: isSelfRegister,
      })
      toast.success(isSelfRegister
        ? 'Factory registered! A team member will review and approve it shortly.'
        : 'Factory added successfully')
      resetForm()
      onClose()
    } catch (err) {
      toast.error('Failed to save', { description: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Factory Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Garments Ltd." required />
            </div>
            <div className="space-y-1.5">
              <Label>Factory Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FAC-001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Country *</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" required />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tirupur" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contact Name *</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Smith" required />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email *</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="john@factory.com" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contact Phone</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-2">
            <Label>Certifications</Label>
            <div className="flex flex-wrap gap-2">
              {CERT_OPTIONS.map((cert) => (
                <button
                  key={cert}
                  type="button"
                  onClick={() => toggleCert(cert)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    certs.includes(cert)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/60'
                  )}
                >
                  {cert}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
