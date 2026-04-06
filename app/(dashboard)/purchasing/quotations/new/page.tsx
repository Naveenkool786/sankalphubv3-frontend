'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, FileText, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createQuotation } from '@/lib/actions/purchasing'
import { SUPPORTED_CURRENCIES } from '@/lib/types/costing'

interface LineItem { description: string; style_number: string; quantity: string; unit: string; unit_price: string }

export default function NewQuotationPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    project_id: '', supplier_name: '', supplier_contact: '', supplier_email: '',
    factory_id: '', currency: 'USD', valid_until: '', payment_terms: '', delivery_terms: '', notes: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const [items, setItems] = useState<LineItem[]>([{ description: '', style_number: '', quantity: '', unit: 'pcs', unit_price: '' }])

  useEffect(() => {
    (async () => {
      const ctx = await (await fetch('/api/user/context')).json()
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: p }, { data: f }] = await Promise.all([
        (supabase.from('projects') as any).select('id, name').eq('org_id', ctx.orgId).order('name'),
        (supabase.from('factories') as any).select('id, name').eq('is_active', true).order('name'),
      ])
      if (p) setProjects(p)
      if (f) setFactories(f)
    })()
  }, [])

  const addItem = () => setItems(prev => [...prev, { description: '', style_number: '', quantity: '', unit: 'pcs', unit_price: '' }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const total = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0)

  const handleSubmit = async () => {
    if (!form.supplier_name) { toast.error('Supplier name is required'); return }
    setSaving(true)
    const validItems = items.filter(i => i.description && i.quantity && i.unit_price)
    const result = await createQuotation({
      project_id: form.project_id || undefined,
      supplier_name: form.supplier_name,
      supplier_contact: form.supplier_contact || undefined,
      supplier_email: form.supplier_email || undefined,
      factory_id: form.factory_id || undefined,
      currency: form.currency,
      valid_until: form.valid_until || undefined,
      payment_terms: form.payment_terms || undefined,
      delivery_terms: form.delivery_terms || undefined,
      notes: form.notes || undefined,
      items: validItems.map(i => ({
        description: i.description,
        style_number: i.style_number || undefined,
        quantity: parseFloat(i.quantity),
        unit: i.unit,
        unit_price: parseFloat(i.unit_price),
      })),
    })
    setSaving(false)
    if (result.success) {
      toast.success('Quotation created')
      router.push(`/purchasing/quotations/${result.id}`)
    } else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <FileText className="w-5 h-5" style={{ color: '#D4A843' }} /> New Quotation
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Create a supplier quotation</p>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Supplier Name *</Label>
            <Input className="h-9 text-sm" value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} placeholder="Supplier name" />
          </div>
          <div><Label className="text-xs text-muted-foreground">Project</Label>
            <select className={selCls} value={form.project_id} onChange={e => set('project_id', e.target.value)}>
              <option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Contact</Label>
            <Input className="h-9 text-sm" value={form.supplier_contact} onChange={e => set('supplier_contact', e.target.value)} />
          </div>
          <div><Label className="text-xs text-muted-foreground">Email</Label>
            <Input className="h-9 text-sm" value={form.supplier_email} onChange={e => set('supplier_email', e.target.value)} />
          </div>
          <div><Label className="text-xs text-muted-foreground">Factory</Label>
            <select className={selCls} value={form.factory_id} onChange={e => set('factory_id', e.target.value)}>
              <option value="">Select factory</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Currency</Label>
            <select className={selCls} value={form.currency} onChange={e => set('currency', e.target.value)}>
              {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
            </select>
          </div>
          <div><Label className="text-xs text-muted-foreground">Valid Until</Label>
            <Input type="date" className="h-9 text-sm" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} />
          </div>
          <div><Label className="text-xs text-muted-foreground">Delivery Terms</Label>
            <Input className="h-9 text-sm" value={form.delivery_terms} onChange={e => set('delivery_terms', e.target.value)} placeholder="FOB Shanghai" />
          </div>
        </div>
        <div><Label className="text-xs text-muted-foreground">Payment Terms</Label>
          <Input className="h-9 text-sm" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)} placeholder="30% advance, 70% before shipment" />
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground font-semibold">Line Items</Label>
            <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={addItem}><Plus className="w-3 h-3" /> Add</Button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_80px_60px_100px_32px] gap-2 items-end">
                <div>
                  {i === 0 && <label className="text-[10px] text-muted-foreground">Description</label>}
                  <Input className="h-8 text-xs" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item description" />
                </div>
                <div>
                  {i === 0 && <label className="text-[10px] text-muted-foreground">Style #</label>}
                  <Input className="h-8 text-xs" value={item.style_number} onChange={e => updateItem(i, 'style_number', e.target.value)} />
                </div>
                <div>
                  {i === 0 && <label className="text-[10px] text-muted-foreground">Qty</label>}
                  <Input type="number" className="h-8 text-xs" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                </div>
                <div>
                  {i === 0 && <label className="text-[10px] text-muted-foreground">Unit</label>}
                  <select className="w-full h-8 px-1 rounded border border-border bg-background text-xs" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                    {['pcs', 'yard', 'meter', 'kg', 'set', 'roll'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  {i === 0 && <label className="text-[10px] text-muted-foreground">Unit Price</label>}
                  <Input type="number" step="0.01" className="h-8 text-xs" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                </div>
                <button onClick={() => removeItem(i)} className="h-8 w-8 flex items-center justify-center hover:bg-red-50 rounded" disabled={items.length === 1}>
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-right font-mono font-semibold mt-2">Total: {SUPPORTED_CURRENCIES.find(c => c.code === form.currency)?.symbol}{total.toFixed(2)}</p>
        </div>

        <div><Label className="text-xs text-muted-foreground">Notes</Label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.supplier_name} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {saving ? 'Creating...' : 'Create Quotation'}
        </Button>
      </div>
    </div>
  )
}
