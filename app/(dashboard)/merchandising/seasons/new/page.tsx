'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSeason } from '@/lib/actions/merchandising'
import { SEASON_TYPE_CONFIG } from '@/lib/types/merchandising'

export default function NewSeasonPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    season_code: '', season_name: '', year: String(new Date().getFullYear()),
    season_type: 'spring_summer', start_date: '', end_date: '',
    target_styles: '', target_units: '', target_revenue: '', notes: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.season_code || !form.season_name) { toast.error('Code and name required'); return }
    setSaving(true)
    const result = await createSeason({
      season_code: form.season_code, season_name: form.season_name,
      year: parseInt(form.year), season_type: form.season_type,
      start_date: form.start_date || undefined, end_date: form.end_date || undefined,
      target_styles: parseInt(form.target_styles) || undefined,
      target_units: parseInt(form.target_units) || undefined,
      target_revenue: parseFloat(form.target_revenue) || undefined,
      notes: form.notes || undefined,
    })
    setSaving(false)
    if (result.success) { toast.success('Season created'); router.push(`/merchandising/seasons/${result.id}`) }
    else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2"><Calendar className="w-5 h-5" style={{ color: '#D4A843' }} /> New Season</h1>
      <p className="text-sm text-muted-foreground mb-6">Create a new collection season</p>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Season Code *</Label><Input className="h-9 text-sm" value={form.season_code} onChange={e => set('season_code', e.target.value)} placeholder="SS26, FW26" /></div>
          <div><Label className="text-xs text-muted-foreground">Season Name *</Label><Input className="h-9 text-sm" value={form.season_name} onChange={e => set('season_name', e.target.value)} placeholder="Spring/Summer 2026" /></div>
          <div><Label className="text-xs text-muted-foreground">Year</Label><Input type="number" className="h-9 text-sm" value={form.year} onChange={e => set('year', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Type</Label>
            <select className={selCls} value={form.season_type} onChange={e => set('season_type', e.target.value)}>
              {Object.entries(SEASON_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></div>
          <div><Label className="text-xs text-muted-foreground">Start Date</Label><Input type="date" className="h-9 text-sm" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">End Date</Label><Input type="date" className="h-9 text-sm" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Target Styles</Label><Input type="number" className="h-9 text-sm" value={form.target_styles} onChange={e => set('target_styles', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Target Units</Label><Input type="number" className="h-9 text-sm" value={form.target_units} onChange={e => set('target_units', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Target Revenue</Label><Input type="number" step="0.01" className="h-9 text-sm" value={form.target_revenue} onChange={e => set('target_revenue', e.target.value)} /></div>
        </div>
        <div><Label className="text-xs text-muted-foreground">Notes</Label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.season_code} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} {saving ? 'Creating...' : 'Create Season'}
        </Button>
      </div>
    </div>
  )
}
