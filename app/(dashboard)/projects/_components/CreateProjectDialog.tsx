'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createProject } from '../actions'

type Factory = { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  factories: Factory[]
}

export function CreateProjectDialog({ open, onClose, factories }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    product_category: '',
    factory_id: '',
    quantity: '',
    unit: 'pcs',
    deadline: '',
    country: '',
    po_number: '',
    notes: '',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Project name is required'); return }
    if (!form.deadline) { toast.error('Deadline is required'); return }
    const qty = parseInt(form.quantity)
    if (isNaN(qty) || qty < 1) { toast.error('Enter a valid quantity'); return }

    setSaving(true)
    try {
      await createProject({
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
      toast.success('Project created')
      setForm({ name: '', product_category: '', factory_id: '', quantity: '', unit: 'pcs', deadline: '', country: '', po_number: '', notes: '' })
      onClose()
    } catch {
      toast.error('Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project Name *</Label>
            <Input id="name" placeholder="e.g. Summer Collection 2026" value={form.name} onChange={set('name')} disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product_category">Product Type</Label>
            <Input id="product_category" placeholder="e.g. Running Shoes" value={form.product_category} onChange={set('product_category')} disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="factory">Factory</Label>
            <Select
              value={form.factory_id}
              onValueChange={(v) => setForm((f) => ({ ...f, factory_id: v }))}
              disabled={saving}
            >
              <SelectTrigger id="factory">
                <SelectValue placeholder="Select a factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.length === 0 ? (
                  <SelectItem value="none" disabled>No factories added yet</SelectItem>
                ) : (
                  factories.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" type="number" min={1} placeholder="e.g. 5000" value={form.quantity} onChange={set('quantity')} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" placeholder="pcs" value={form.unit} onChange={set('unit')} disabled={saving} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={set('deadline')} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="e.g. China" value={form.country} onChange={set('country')} disabled={saving} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="po_number">PO Number</Label>
            <Input id="po_number" placeholder="e.g. PO-2026-001" value={form.po_number} onChange={set('po_number')} disabled={saving} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Additional project notes..." rows={3} value={form.notes} onChange={set('notes')} disabled={saving} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
