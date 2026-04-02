'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MapPin, Package, Calendar, User, FileText, ChevronDown, Pencil, Trash2, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, type ProjectRow } from './ProjectCard'
import { updateProject, updateProjectStatus, deleteProject } from '../actions'
import type { ProjectStatus } from '@/types/database'

type Factory = { id: string; name: string }

interface Props {
  project: ProjectRow | null
  open: boolean
  onClose: () => void
  canManage: boolean
  factories: Factory[]
}

const ALL_STATUSES: ProjectStatus[] = ['draft', 'confirmed', 'active', 'in_production', 'inspection', 'in_inspection', 'completed', 'delayed', 'cancelled']

export function ProjectDetailDialog({ project, open, onClose, canManage, factories }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    product_category: '',
    factory_id: '',
    quantity: '',
    unit: '',
    deadline: '',
    country: '',
    po_number: '',
    notes: '',
  })

  if (!project) return null

  const sc = STATUS_CONFIG[project.status]

  const startEdit = () => {
    setForm({
      name: project.name,
      product_category: project.product_category ?? '',
      factory_id: project.factory_id ?? '',
      quantity: project.quantity?.toString() ?? '',
      unit: project.unit ?? 'pcs',
      deadline: project.deadline ?? '',
      country: project.country ?? '',
      po_number: project.po_number ?? '',
      notes: project.notes ?? '',
    })
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Project name is required'); return }
    const qty = parseInt(form.quantity)
    if (isNaN(qty) || qty < 1) { toast.error('Enter a valid quantity'); return }

    setSaving(true)
    try {
      await updateProject(project.id, {
        name: form.name.trim(),
        product_category: form.product_category.trim(),
        factory_id: form.factory_id || null,
        quantity: qty,
        unit: form.unit.trim(),
        deadline: form.deadline,
        country: form.country.trim(),
        po_number: form.po_number.trim(),
        notes: form.notes.trim(),
      })
      toast.success('Project updated')
      setEditing(false)
      onClose()
    } catch {
      toast.error('Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (status: ProjectStatus) => {
    try {
      await updateProjectStatus(project.id, status)
      toast.success(`Status changed to ${STATUS_CONFIG[status].label}`)
      onClose()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteProject(project.id)
      toast.success('Project deleted')
      onClose()
    } catch {
      toast.error('Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(false); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-base">{project.name}</DialogTitle>
              {project.buyer_brand && (
                <p className="text-xs text-muted-foreground mt-0.5">{project.buyer_brand}</p>
              )}
            </div>
            <Badge className={cn('text-[10px] px-1.5 py-0 border-0 mt-0.5', sc.color)}>
              {sc.label}
            </Badge>
          </div>
        </DialogHeader>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Project Name *</Label>
              <Input value={form.name} onChange={set('name')} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Product Type</Label>
              <Input value={form.product_category} onChange={set('product_category')} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Factory</Label>
              <Select value={form.factory_id} onValueChange={(v) => setForm((f) => ({ ...f, factory_id: v }))} disabled={saving}>
                <SelectTrigger><SelectValue placeholder="Select a factory" /></SelectTrigger>
                <SelectContent>
                  {factories.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantity *</Label>
                <Input type="number" min={1} value={form.quantity} onChange={set('quantity')} disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={set('unit')} disabled={saving} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Deadline *</Label>
                <Input type="date" value={form.deadline} onChange={set('deadline')} disabled={saving} />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={form.country} onChange={set('country')} disabled={saving} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>PO Number</Label>
              <Input value={form.po_number} onChange={set('po_number')} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={set('notes')} disabled={saving} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={cancelEdit}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-2 space-y-4">
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'PRODUCT', icon: Package, value: project.product_category },
                { label: 'FACTORY', icon: MapPin, value: project.factories?.name },
                { label: 'QUANTITY', icon: Package, value: project.quantity ? `${project.quantity.toLocaleString()} ${project.unit ?? 'units'}` : null },
                { label: 'DEADLINE', icon: Calendar, value: project.deadline ? new Date(project.deadline).toLocaleDateString() : null },
                { label: 'COUNTRY', icon: MapPin, value: project.country },
                { label: 'PO NUMBER', icon: FileText, value: project.po_number },
                { label: 'INSPECTOR', icon: User, value: project.inspector?.full_name ?? 'Unassigned' },
              ].map(({ label, icon: Icon, value }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">{label}</p>
                  <div className="flex items-center gap-1 text-sm text-foreground">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span>{value ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {project.notes && (
              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">NOTES</p>
                <p className="text-sm text-foreground">{project.notes}</p>
              </div>
            )}

            {/* Status change */}
            {canManage && (
              <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">CHANGE STATUS</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="gap-1.5">
                      {sc.label} <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {ALL_STATUSES.filter((s) => s !== project.status).map((s) => {
                      const cfg = STATUS_CONFIG[s]
                      return (
                        <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                          <Badge className={cn('text-[10px] px-1.5 py-0 border-0 mr-2', cfg.color)}>{cfg.label}</Badge>
                          {cfg.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-2">
                {canManage && (
                  <>
                    <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete} disabled={deleting}>
                      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-1.5" onClick={startEdit}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setEditing(false); onClose() }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
