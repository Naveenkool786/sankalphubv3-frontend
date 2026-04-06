'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createStyle } from '@/lib/actions/merchandising'
import { generateStyleNumber } from '@/lib/types/merchandising'

export default function NewStylePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [seasons, setSeasons] = useState<{ id: string; season_code: string }[]>([])
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    style_number: '', style_name: '', season_id: '', category: 'woven',
    sub_category: '', gender: 'unisex', description: '',
    wholesale_price: '', retail_price: '', target_fob: '',
    fabric_composition: '', weight_gsm: '', construction: '', silhouette: '',
    factory_id: '', buyer_brand: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: s }, { data: f }] = await Promise.all([
        (supabase.from('seasons') as any).select('id, season_code').neq('status', 'archived').order('year', { ascending: false }),
        (supabase.from('factories') as any).select('id, name').eq('is_active', true).order('name'),
      ])
      if (s) setSeasons(s)
      if (f) setFactories(f)
    })()
  }, [])

  // Auto-generate style number when category/season changes
  useEffect(() => {
    if (form.category) {
      const seasonCode = seasons.find(s => s.id === form.season_id)?.season_code || 'GEN'
      const seq = Math.floor(Math.random() * 9000) + 1000
      set('style_number', generateStyleNumber(form.category, seasonCode, seq))
    }
  }, [form.category, form.season_id, seasons])

  const handleSubmit = async () => {
    if (!form.style_number || !form.style_name) { toast.error('Style # and name required'); return }
    setSaving(true)
    const result = await createStyle({
      style_number: form.style_number, style_name: form.style_name,
      season_id: form.season_id || undefined, category: form.category || undefined,
      sub_category: form.sub_category || undefined, gender: form.gender || undefined,
      description: form.description || undefined,
      wholesale_price: parseFloat(form.wholesale_price) || undefined,
      retail_price: parseFloat(form.retail_price) || undefined,
      target_fob: parseFloat(form.target_fob) || undefined,
      fabric_composition: form.fabric_composition || undefined,
      weight_gsm: parseFloat(form.weight_gsm) || undefined,
      construction: form.construction || undefined, silhouette: form.silhouette || undefined,
      factory_id: form.factory_id || undefined, buyer_brand: form.buyer_brand || undefined,
    })
    setSaving(false)
    if (result.success) { toast.success('Style created'); router.push(`/merchandising/styles/${result.id}`) }
    else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2"><Palette className="w-5 h-5" style={{ color: '#D4A843' }} /> New Style</h1>
      <p className="text-sm text-muted-foreground mb-6">Add a new style to the library</p>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Style Number *</Label><Input className="h-9 text-sm font-mono" value={form.style_number} onChange={e => set('style_number', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Style Name *</Label><Input className="h-9 text-sm" value={form.style_name} onChange={e => set('style_name', e.target.value)} placeholder="Men's Quilted Vest" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Category</Label>
            <select className={selCls} value={form.category} onChange={e => set('category', e.target.value)}>
              {['woven', 'knits', 'denim', 'outerwear', 'accessories'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select></div>
          <div><Label className="text-xs text-muted-foreground">Sub-category</Label><Input className="h-9 text-sm" value={form.sub_category} onChange={e => set('sub_category', e.target.value)} placeholder="jackets, pants..." /></div>
          <div><Label className="text-xs text-muted-foreground">Gender</Label>
            <select className={selCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
              {['mens', 'womens', 'unisex', 'kids', 'N/A'].map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Season</Label>
            <select className={selCls} value={form.season_id} onChange={e => set('season_id', e.target.value)}>
              <option value="">—</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.season_code}</option>)}
            </select></div>
          <div><Label className="text-xs text-muted-foreground">Factory</Label>
            <select className={selCls} value={form.factory_id} onChange={e => set('factory_id', e.target.value)}>
              <option value="">—</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Wholesale Price</Label><Input type="number" step="0.01" className="h-9 text-sm" value={form.wholesale_price} onChange={e => set('wholesale_price', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Retail Price</Label><Input type="number" step="0.01" className="h-9 text-sm" value={form.retail_price} onChange={e => set('retail_price', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Target FOB</Label><Input type="number" step="0.01" className="h-9 text-sm" value={form.target_fob} onChange={e => set('target_fob', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Fabric Composition</Label><Input className="h-9 text-sm" value={form.fabric_composition} onChange={e => set('fabric_composition', e.target.value)} placeholder="100% Nylon, 65/35 Poly/Cotton" /></div>
          <div><Label className="text-xs text-muted-foreground">Buyer Brand</Label><Input className="h-9 text-sm" value={form.buyer_brand} onChange={e => set('buyer_brand', e.target.value)} /></div>
        </div>
        <div><Label className="text-xs text-muted-foreground">Description</Label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.description} onChange={e => set('description', e.target.value)} /></div>

        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.style_number || !form.style_name} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />} {saving ? 'Creating...' : 'Create Style'}
        </Button>
      </div>
    </div>
  )
}
