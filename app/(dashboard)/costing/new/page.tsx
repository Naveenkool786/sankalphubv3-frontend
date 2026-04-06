'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCostSheet } from '@/lib/actions/costing'
import { SUPPORTED_CURRENCIES, DEFAULT_COST_CATEGORIES, type CostCategory } from '@/lib/types/costing'

export default function NewCostSheetPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    project_id: '', style_number: '', style_name: '', currency: 'USD',
    target_fob: '', notes: '', template: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const ctx = await (await fetch('/api/user/context')).json()
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('projects') as any).select('id, name').eq('org_id', ctx.orgId).order('name')
      if (data) setProjects(data)
    })()
  }, [])

  const templateCategories: CostCategory[] = form.template ? (DEFAULT_COST_CATEGORIES[form.template] || []) : []

  const handleSubmit = async () => {
    if (!form.project_id) { toast.error('Select a project'); return }
    setSaving(true)
    const result = await createCostSheet({
      project_id: form.project_id,
      style_number: form.style_number || undefined,
      style_name: form.style_name || undefined,
      currency: form.currency,
      target_fob: form.target_fob ? parseFloat(form.target_fob) : undefined,
      notes: form.notes || undefined,
      template_categories: templateCategories.length > 0 ? templateCategories : undefined,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Cost sheet created')
      router.push(`/costing/${result.id}`)
    } else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Calculator className="w-5 h-5" style={{ color: '#D4A843' }} /> New Cost Sheet
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Create a garment cost breakdown (BOM)</p>

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
            <Label className="text-xs text-muted-foreground">Currency</Label>
            <select className={selCls} value={form.currency} onChange={e => set('currency', e.target.value)}>
              {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Style Number</Label>
            <Input className="h-9 text-sm" value={form.style_number} onChange={e => set('style_number', e.target.value)} placeholder="e.g. STY-2024-001" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Style Name</Label>
            <Input className="h-9 text-sm" value={form.style_name} onChange={e => set('style_name', e.target.value)} placeholder="e.g. Men's Oxford Shirt" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Target FOB Price</Label>
            <Input type="number" step="0.01" className="h-9 text-sm" value={form.target_fob} onChange={e => set('target_fob', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">BOM Template</Label>
            <select className={selCls} value={form.template} onChange={e => set('template', e.target.value)}>
              <option value="">No template (blank)</option>
              {Object.keys(DEFAULT_COST_CATEGORIES).map(k => (
                <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)} — {DEFAULT_COST_CATEGORIES[k].length} categories</option>
              ))}
            </select>
          </div>
        </div>

        {templateCategories.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Pre-filled categories ({templateCategories.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {templateCategories.map(c => (
                <span key={c} className="px-2 py-0.5 bg-background rounded text-[10px] border border-border">{c}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground">Notes</Label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Special notes..." />
        </div>

        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.project_id} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
          {saving ? 'Creating...' : 'Create Cost Sheet'}
        </Button>
      </div>
    </div>
  )
}
