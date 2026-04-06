'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAuditV2 } from '@/lib/actions/audits'

export default function NewAuditPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])
  const [templates, setTemplates] = useState<{ id: string; template_name: string; standard: string }[]>([])

  const [form, setForm] = useState({
    factory_id: '', template_id: '', audit_date: format(new Date(), 'yyyy-MM-dd'),
    audit_type: 'initial', auditor_name: '', auditor_organization: '',
    department: '', plant_audited: '', shift_audited: '', attendees: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const [{ data: f }, { data: t }] = await Promise.all([
        (supabase.from('factories') as any).select('id, name').eq('is_active', true).order('name'),
        (supabase.from('audit_templates') as any).select('id, template_name, standard').eq('is_active', true).order('template_name'),
      ])
      if (f) setFactories(f)
      if (t) {
        setTemplates(t)
        const def = t.find((tp: any) => tp.standard === 'RW-v1.0')
        if (def) set('template_id', def.id)
      }
    })()
  }, [])

  const handleSubmit = async () => {
    if (!form.factory_id) { toast.error('Select a factory'); return }
    if (!form.template_id) { toast.error('Select a template'); return }
    if (!form.auditor_name) { toast.error('Enter auditor name'); return }
    setSaving(true)
    const result = await createAuditV2({
      factory_id: form.factory_id,
      template_id: form.template_id,
      audit_date: form.audit_date,
      audit_type: form.audit_type,
      auditor_name: form.auditor_name,
      auditor_organization: form.auditor_organization || undefined,
      department: form.department || undefined,
      plant_audited: form.plant_audited || undefined,
      shift_audited: form.shift_audited || undefined,
      attendees: form.attendees || undefined,
    })
    setSaving(false)
    if (result.success) { toast.success('Audit created'); router.push(`/audits/${result.id}`) }
    else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2"><ClipboardCheck className="w-5 h-5" style={{ color: '#D4A843' }} /> Start New Audit</h1>
      <p className="text-sm text-muted-foreground mb-6">Select factory, template, and audit details</p>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Factory *</Label>
            <select className={selCls} value={form.factory_id} onChange={e => set('factory_id', e.target.value)}>
              <option value="">Select factory</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div><Label className="text-xs text-muted-foreground">Audit Template *</Label>
            <select className={selCls} value={form.template_id} onChange={e => set('template_id', e.target.value)}>
              <option value="">Select template</option>{templates.map(t => <option key={t.id} value={t.id}>{t.template_name} ({t.standard})</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Audit Date *</Label>
            <Input type="date" className="h-9 text-sm" value={form.audit_date} onChange={e => set('audit_date', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Audit Type</Label>
            <select className={selCls} value={form.audit_type} onChange={e => set('audit_type', e.target.value)}>
              <option value="initial">Initial</option><option value="follow_up">Follow-up</option>
              <option value="annual">Annual</option><option value="special">Special</option>
            </select></div>
          <div><Label className="text-xs text-muted-foreground">Auditor Name *</Label>
            <Input className="h-9 text-sm" value={form.auditor_name} onChange={e => set('auditor_name', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Auditor Organization</Label>
            <Input className="h-9 text-sm" value={form.auditor_organization} onChange={e => set('auditor_organization', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Department</Label>
            <Input className="h-9 text-sm" value={form.department} onChange={e => set('department', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label className="text-xs text-muted-foreground">Plant Audited</Label>
            <Input className="h-9 text-sm" value={form.plant_audited} onChange={e => set('plant_audited', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Shift Audited</Label>
            <Input className="h-9 text-sm" value={form.shift_audited} onChange={e => set('shift_audited', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Attendees</Label>
            <Input className="h-9 text-sm" value={form.attendees} onChange={e => set('attendees', e.target.value)} /></div>
        </div>

        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.factory_id || !form.template_id} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} {saving ? 'Creating...' : 'Start Audit'}
        </Button>
      </div>
    </div>
  )
}
