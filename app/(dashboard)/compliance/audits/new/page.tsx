'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createFactoryAudit } from '@/lib/actions/compliance'
import { AUDIT_TYPE_CONFIG, type AuditType } from '@/lib/types/compliance'

export default function NewAuditPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ factory_id: '', audit_type: 'social' as AuditType, audit_standard: '', auditor_name: '', auditor_organization: '', audit_date: '', next_audit_date: '', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('factories') as any).select('id, name').eq('is_active', true).order('name')
      if (data) setFactories(data)
    })()
  }, [])

  const handleSubmit = async () => {
    if (!form.factory_id) { toast.error('Select a factory'); return }
    setSaving(true)
    const result = await createFactoryAudit({
      factory_id: form.factory_id,
      audit_type: form.audit_type,
      audit_standard: form.audit_standard || undefined,
      auditor_name: form.auditor_name || undefined,
      auditor_organization: form.auditor_organization || undefined,
      audit_date: form.audit_date || undefined,
      next_audit_date: form.next_audit_date || undefined,
      notes: form.notes || undefined,
    })
    setSaving(false)
    if (result.success) { toast.success('Audit scheduled'); router.push(`/compliance/audits/${result.id}`) }
    else toast.error('Failed', { description: result.error })
  }

  const selCls = 'w-full h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
      <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2"><FileCheck className="w-5 h-5" style={{ color: '#D4A843' }} /> Schedule Audit</h1>
      <p className="text-sm text-muted-foreground mb-6">Schedule a factory compliance audit</p>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Factory *</Label>
            <select className={selCls} value={form.factory_id} onChange={e => set('factory_id', e.target.value)}>
              <option value="">Select factory</option>{factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select></div>
          <div><Label className="text-xs text-muted-foreground">Audit Type *</Label>
            <select className={selCls} value={form.audit_type} onChange={e => set('audit_type', e.target.value)}>
              {Object.entries(AUDIT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select></div>
        </div>
        <div><Label className="text-xs text-muted-foreground">Standard</Label>
          <Input className="h-9 text-sm" value={form.audit_standard} onChange={e => set('audit_standard', e.target.value)} placeholder="BSCI, WRAP, SA8000, ISO 9001..." /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Auditor Name</Label><Input className="h-9 text-sm" value={form.auditor_name} onChange={e => set('auditor_name', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Auditor Organization</Label><Input className="h-9 text-sm" value={form.auditor_organization} onChange={e => set('auditor_organization', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs text-muted-foreground">Audit Date</Label><Input type="date" className="h-9 text-sm" value={form.audit_date} onChange={e => set('audit_date', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Next Audit Date</Label><Input type="date" className="h-9 text-sm" value={form.next_audit_date} onChange={e => set('next_audit_date', e.target.value)} /></div>
        </div>
        <div><Label className="text-xs text-muted-foreground">Notes</Label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving || !form.factory_id} style={{ backgroundColor: '#D4A843' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />} {saving ? 'Scheduling...' : 'Schedule Audit'}
        </Button>
      </div>
    </div>
  )
}
