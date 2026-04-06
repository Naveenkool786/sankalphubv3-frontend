'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { format, addDays } from 'date-fns'
import { createProductionOrder } from '@/lib/actions/production'
import { DEFAULT_MILESTONES, STATUS_CONFIG, type ProductionCategory } from '@/lib/types/production'

const CATEGORIES: { value: ProductionCategory; label: string }[] = [
  { value: 'woven', label: 'Woven' },
  { value: 'knits', label: 'Knits' },
  { value: 'denim', label: 'Denim' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'accessories', label: 'Accessories' },
]

function generateOrderNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PO-${date}-${random}`
}

export default function NewProductionOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    order_number: generateOrderNumber(),
    style_number: '',
    style_name: '',
    category: '' as ProductionCategory | '',
    project_id: '',
    factory_id: '',
    buyer_brand: '',
    season: '',
    total_quantity: '',
    unit: 'pcs',
    planned_start_date: '',
    planned_end_date: '',
    ex_factory_date: '',
    priority: 'normal',
    notes: '',
  })

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    Promise.all([
      fetch('/api/user/context').then(r => r.json()),
    ]).then(async ([ctx]) => {
      const { data: p } = await (supabase.from('projects') as any).select('id, name').eq('org_id', ctx.orgId).order('name')
      const { data: f } = await (supabase.from('factories') as any).select('id, name').eq('org_id', ctx.orgId).eq('is_active', true).order('name')
      if (p) setProjects(p)
      if (f) setFactories(f)
    })
  }, [])

  const milestonePreview = form.category ? DEFAULT_MILESTONES[form.category as ProductionCategory] : []

  const handleCreate = async () => {
    if (!form.project_id) { toast.error('Select a project'); return }
    if (!form.category) { toast.error('Select a category'); return }
    if (!form.total_quantity || parseInt(form.total_quantity) < 1) { toast.error('Enter a valid quantity'); return }
    if (!form.planned_start_date || !form.planned_end_date) { toast.error('Set start and end dates'); return }

    setSaving(true)
    const result = await createProductionOrder({
      order_number: form.order_number,
      style_number: form.style_number || undefined,
      style_name: form.style_name || undefined,
      category: form.category as ProductionCategory,
      project_id: form.project_id,
      factory_id: form.factory_id || undefined,
      buyer_brand: form.buyer_brand || undefined,
      season: form.season || undefined,
      total_quantity: parseInt(form.total_quantity),
      unit: form.unit,
      planned_start_date: form.planned_start_date,
      planned_end_date: form.planned_end_date,
      ex_factory_date: form.ex_factory_date || undefined,
      priority: form.priority as any,
      notes: form.notes || undefined,
    })

    setSaving(false)
    if (result.success) {
      toast.success(`Production order ${form.order_number} created`)
      router.push(`/production/${result.id}`)
    } else {
      toast.error('Failed to create order', { description: result.error })
    }
  }

  const inputCls = 'h-9 text-sm'
  const labelCls = 'text-xs font-medium text-muted-foreground'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">New Production Order</h1>
      <p className="text-sm text-muted-foreground mb-6">Step {step} of 3</p>

      {/* Step 1: Order Details */}
      {step === 1 && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold">Order Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className={labelCls}>Order Number</Label><Input className={inputCls} value={form.order_number} onChange={e => set('order_number', e.target.value)} /></div>
            <div><Label className={labelCls}>Style Number</Label><Input className={inputCls} value={form.style_number} onChange={e => set('style_number', e.target.value)} placeholder="e.g. ST-2026-001" /></div>
          </div>
          <div><Label className={labelCls}>Style Name</Label><Input className={inputCls} value={form.style_name} onChange={e => set('style_name', e.target.value)} placeholder="e.g. Classic Oxford Shirt" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={labelCls}>Category *</Label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label className={labelCls}>Project *</Label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.project_id} onChange={e => set('project_id', e.target.value)}>
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={labelCls}>Factory</Label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.factory_id} onChange={e => set('factory_id', e.target.value)}>
                <option value="">Select factory</option>
                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div><Label className={labelCls}>Buyer / Brand</Label><Input className={inputCls} value={form.buyer_brand} onChange={e => set('buyer_brand', e.target.value)} placeholder="e.g. Nike, H&M" /></div>
          </div>
          <div><Label className={labelCls}>Season</Label><Input className={inputCls} value={form.season} onChange={e => set('season', e.target.value)} placeholder="e.g. SS26, FW26" /></div>
          <Button className="w-full gap-2 mt-2" onClick={() => setStep(2)} disabled={!form.category || !form.project_id}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Quantities & Dates */}
      {step === 2 && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold">Quantities & Dates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className={labelCls}>Total Quantity *</Label><Input type="number" className={inputCls} value={form.total_quantity} onChange={e => set('total_quantity', e.target.value)} placeholder="e.g. 5000" /></div>
            <div>
              <Label className={labelCls}>Unit</Label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.unit} onChange={e => set('unit', e.target.value)}>
                <option value="pcs">Pieces</option>
                <option value="dozens">Dozens</option>
                <option value="meters">Meters</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label className={labelCls}>Planned Start *</Label><Input type="date" className={inputCls} value={form.planned_start_date} onChange={e => set('planned_start_date', e.target.value)} /></div>
            <div><Label className={labelCls}>Planned End *</Label><Input type="date" className={inputCls} value={form.planned_end_date} onChange={e => set('planned_end_date', e.target.value)} /></div>
            <div><Label className={labelCls}>Ex-Factory Date</Label><Input type="date" className={inputCls} value={form.ex_factory_date} onChange={e => set('ex_factory_date', e.target.value)} /></div>
          </div>
          <div>
            <Label className={labelCls}>Priority</Label>
            <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div><Label className={labelCls}>Notes</Label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." /></div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button className="flex-1 gap-2" onClick={() => setStep(3)} disabled={!form.total_quantity || !form.planned_start_date || !form.planned_end_date}>
              Review <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-sm font-semibold mb-4">Review Order</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Order #', form.order_number],
                ['Style', [form.style_number, form.style_name].filter(Boolean).join(' — ') || '—'],
                ['Category', form.category],
                ['Project', projects.find(p => p.id === form.project_id)?.name || '—'],
                ['Factory', factories.find(f => f.id === form.factory_id)?.name || '—'],
                ['Buyer', form.buyer_brand || '—'],
                ['Quantity', `${parseInt(form.total_quantity || '0').toLocaleString()} ${form.unit}`],
                ['Start', form.planned_start_date],
                ['End', form.planned_end_date],
                ['Ex-Factory', form.ex_factory_date || '—'],
                ['Priority', form.priority],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone preview */}
          {milestonePreview.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold mb-3">Auto-Generated Milestones</h2>
              <div className="space-y-2">
                {milestonePreview.map((m, i) => {
                  const start = form.planned_start_date ? addDays(new Date(form.planned_start_date), milestonePreview.slice(0, i).reduce((s, x) => s + x.defaultDays + 1, 0)) : null
                  return (
                    <div key={m.name} className="flex items-center gap-3 text-xs">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">{m.order}</span>
                      <span className="flex-1 text-foreground">{m.name}</span>
                      <span className="text-muted-foreground">{m.defaultDays} days</span>
                      {start && <span className="text-muted-foreground">{format(start, 'dd MMM')}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button className="flex-1 gap-2" onClick={handleCreate} disabled={saving} style={{ backgroundColor: '#D4A843' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
