'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTestRequest } from '@/lib/actions/testing'
import { TEST_CATEGORY_CONFIG, DEFAULT_TEST_TEMPLATES, type TestCategory } from '@/lib/types/testing'

export default function NewTestRequestPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [labs, setLabs] = useState<{ id: string; lab_name: string }[]>([])

  const [form, setForm] = useState({
    project_id: '', production_order_id: '', test_category: 'physical' as TestCategory,
    lab_id: '', fabric_type: '', fabric_composition: '', color: '',
    buyer_standard: '', notes: '', template_index: '-1',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const ctx = await (await fetch('/api/user/context')).json()
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: p }, { data: l }] = await Promise.all([
        (supabase.from('projects') as any).select('id, name').eq('org_id', ctx.orgId).order('name'),
        (supabase.from('lab_partners') as any).select('id, lab_name').eq('is_active', true).order('lab_name'),
      ])
      if (p) setProjects(p)
      if (l) setLabs(l)
    })()
  }, [])

  const matchingTemplates = DEFAULT_TEST_TEMPLATES.filter(t => t.category === form.test_category)
  const selectedTemplate = parseInt(form.template_index) >= 0 ? matchingTemplates[parseInt(form.template_index)] : null

  const handleSubmit = async () => {
    if (!form.project_id) { toast.error('Select a project'); return }
    setSaving(true)
    const result = await createTestRequest({
      project_id: form.project_id,
      test_category: form.test_category,
      lab_id: form.lab_id || undefined,
      fabric_type: form.fabric_type || undefined,
      fabric_composition: form.fabric_composition || undefined,
      color: form.color || undefined,
      buyer_standard: form.buyer_standard || undefined,
      notes: form.notes || undefined,
      tests: selectedTemplate?.tests,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Test request created')
      router.push(`/testing/${result.id}`)
    } else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <FlaskConical className="w-5 h-5" style={{ color: '#D4A843' }} /> New Test Request
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Submit fabric or garment for testing</p>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Project *</Label>
            <select className={selCls} value={form.project_id} onChange={e => set('project_id', e.target.value)}>
              <option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs text-muted-foreground">Test Category *</Label>
            <select className={selCls} value={form.test_category} onChange={e => { set('test_category', e.target.value); set('template_index', '-1') }}>
              {Object.entries(TEST_CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Lab Partner</Label>
            <select className={selCls} value={form.lab_id} onChange={e => set('lab_id', e.target.value)}>
              <option value="">Select lab</option>{labs.map(l => <option key={l.id} value={l.id}>{l.lab_name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs text-muted-foreground">Buyer Standard</Label>
            <Input className="h-9 text-sm" value={form.buyer_standard} onChange={e => set('buyer_standard', e.target.value)} placeholder="e.g. M&S P100, Nike RSL" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Fabric Type</Label><Input className="h-9 text-sm" value={form.fabric_type} onChange={e => set('fabric_type', e.target.value)} placeholder="e.g. Twill, Jersey" /></div>
          <div><Label className="text-xs text-muted-foreground">Composition</Label><Input className="h-9 text-sm" value={form.fabric_composition} onChange={e => set('fabric_composition', e.target.value)} placeholder="100% Cotton" /></div>
          <div><Label className="text-xs text-muted-foreground">Color</Label><Input className="h-9 text-sm" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Navy Blue" /></div>
        </div>

        {/* Template selector */}
        <div>
          <Label className="text-xs text-muted-foreground">Test Template</Label>
          <select className={selCls} value={form.template_index} onChange={e => set('template_index', e.target.value)}>
            <option value="-1">No template (add tests manually later)</option>
            {matchingTemplates.map((t, i) => <option key={i} value={i}>{t.name} — {t.tests.length} tests</option>)}
          </select>
        </div>

        {selectedTemplate && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Tests to be created ({selectedTemplate.tests.length})</p>
            <div className="space-y-1">
              {selectedTemplate.tests.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{t.test_name}</span>
                  <span className="text-muted-foreground">{t.test_method} · {t.required_value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div><Label className="text-xs text-muted-foreground">Notes</Label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Special instructions..." />
        </div>

        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.project_id} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
          {saving ? 'Creating...' : 'Create Test Request'}
        </Button>
      </div>
    </div>
  )
}
