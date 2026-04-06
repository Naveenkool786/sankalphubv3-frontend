'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, Scissors } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSampleRequest } from '@/lib/actions/sampling'
import { STAGE_ORDER, SAMPLE_TYPE_CONFIG } from '@/lib/types/sampling'

export default function NewSampleRequestPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])
  const [prodOrders, setProdOrders] = useState<{ id: string; order_number: string; style_name: string | null; category: string | null; factory_id: string | null }[]>([])

  const [form, setForm] = useState({
    project_id: '', production_order_id: '', style_number: '', style_name: '',
    category: '', sample_type: 'proto', factory_id: '', buyer_brand: '',
    required_date: '', priority: 'normal', size_range: '', color: '',
    fabric_details: '', special_instructions: '',
  })

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    (async () => {
      const ctxRes = await fetch('/api/user/context')
      const ctx = await ctxRes.json()
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: p }, { data: f }, { data: po }] = await Promise.all([
        (supabase.from('projects') as any).select('id, name').eq('org_id', ctx.orgId).order('name'),
        (supabase.from('factories') as any).select('id, name').eq('org_id', ctx.orgId).eq('is_active', true).order('name'),
        (supabase.from('production_orders') as any).select('id, order_number, style_name, category, factory_id').order('created_at', { ascending: false }),
      ])
      if (p) setProjects(p)
      if (f) setFactories(f)
      if (po) setProdOrders(po)
    })()
  }, [])

  // Auto-fill from production order
  const handleProdOrderChange = (poId: string) => {
    set('production_order_id', poId)
    const po = prodOrders.find(o => o.id === poId)
    if (po) {
      if (po.style_name) set('style_name', po.style_name)
      if (po.category) set('category', po.category)
      if (po.factory_id) set('factory_id', po.factory_id)
    }
  }

  const handleSubmit = async () => {
    if (!form.project_id) { toast.error('Select a project'); return }
    setSaving(true)
    const result = await createSampleRequest({
      project_id: form.project_id,
      production_order_id: form.production_order_id || undefined,
      style_number: form.style_number || undefined,
      style_name: form.style_name || undefined,
      category: form.category || undefined,
      sample_type: form.sample_type,
      factory_id: form.factory_id || undefined,
      buyer_brand: form.buyer_brand || undefined,
      required_date: form.required_date || undefined,
      priority: form.priority,
      size_range: form.size_range || undefined,
      color: form.color || undefined,
      fabric_details: form.fabric_details || undefined,
      special_instructions: form.special_instructions || undefined,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Sample request created')
      router.push(`/sampling/${result.id}`)
    } else {
      toast.error('Failed to create', { description: result.error })
    }
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Scissors className="w-5 h-5" style={{ color: '#D4A843' }} /> New Sample Request
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Submit a new sample for review</p>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Project *</Label>
            <select className={selCls} value={form.project_id} onChange={e => set('project_id', e.target.value)}>
              <option value="">Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Production Order</Label>
            <select className={selCls} value={form.production_order_id} onChange={e => handleProdOrderChange(e.target.value)}>
              <option value="">None (optional)</option>
              {prodOrders.map(o => <option key={o.id} value={o.id}>{o.order_number}{o.style_name ? ` — ${o.style_name}` : ''}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Style Number</Label><Input className="h-9 text-sm" value={form.style_number} onChange={e => set('style_number', e.target.value)} placeholder="e.g. ST-2026-001" /></div>
          <div><Label className="text-xs text-muted-foreground">Style Name</Label><Input className="h-9 text-sm" value={form.style_name} onChange={e => set('style_name', e.target.value)} placeholder="e.g. Classic Oxford" /></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Sample Type *</Label>
            <select className={selCls} value={form.sample_type} onChange={e => set('sample_type', e.target.value)}>
              {STAGE_ORDER.map(t => <option key={t} value={t}>{SAMPLE_TYPE_CONFIG[t].label}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Category</Label>
            <select className={selCls} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select</option>
              {['woven', 'knits', 'denim', 'outerwear', 'accessories'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <select className={selCls} value={form.priority} onChange={e => set('priority', e.target.value)}>
              {['low', 'normal', 'high', 'urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Factory</Label>
            <select className={selCls} value={form.factory_id} onChange={e => set('factory_id', e.target.value)}>
              <option value="">Select factory</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs text-muted-foreground">Buyer / Brand</Label><Input className="h-9 text-sm" value={form.buyer_brand} onChange={e => set('buyer_brand', e.target.value)} placeholder="e.g. H&M" /></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Required Date</Label><Input type="date" className="h-9 text-sm" value={form.required_date} onChange={e => set('required_date', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Size Range</Label><Input className="h-9 text-sm" value={form.size_range} onChange={e => set('size_range', e.target.value)} placeholder="S-M-L-XL" /></div>
          <div><Label className="text-xs text-muted-foreground">Color</Label><Input className="h-9 text-sm" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Navy Blue" /></div>
        </div>

        <div><Label className="text-xs text-muted-foreground">Fabric Details</Label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.fabric_details} onChange={e => set('fabric_details', e.target.value)} placeholder="Fabric composition, weight, supplier..." /></div>
        <div><Label className="text-xs text-muted-foreground">Special Instructions</Label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} placeholder="Any special requirements..." /></div>

        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.project_id} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
          {saving ? 'Creating...' : 'Create Sample Request'}
        </Button>
      </div>
    </div>
  )
}
