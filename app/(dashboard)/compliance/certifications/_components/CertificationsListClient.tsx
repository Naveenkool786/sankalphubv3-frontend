'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Award, Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CERT_STATUS_CONFIG, getExpiryStatus, type ProductCertification, type CertStatus } from '@/lib/types/compliance'
import { createCertification } from '@/lib/actions/compliance'

interface Props { certs: ProductCertification[]; projects: { id: string; name: string }[]; canManage: boolean }

export function CertificationsListClient({ certs, projects, canManage }: Props) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ project_id: '', certification_name: '', certification_body: '', certificate_number: '', applied_date: '', expiry_date: '', scope: '', notes: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const filtered = certs.filter(c => !search || [c.certification_name, c.certification_body, c.projects?.name].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  const handleCreate = async () => {
    if (!form.certification_name) { toast.error('Name required'); return }
    setSaving(true)
    const result = await createCertification({
      project_id: form.project_id || undefined,
      certification_name: form.certification_name,
      certification_body: form.certification_body || undefined,
      certificate_number: form.certificate_number || undefined,
      applied_date: form.applied_date || undefined,
      expiry_date: form.expiry_date || undefined,
      scope: form.scope || undefined,
      notes: form.notes || undefined,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Certification added')
      setForm({ project_id: '', certification_name: '', certification_body: '', certificate_number: '', applied_date: '', expiry_date: '', scope: '', notes: '' })
      setShowForm(false)
    } else toast.error('Failed', { description: result.error })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5" style={{ color: '#D4A843' }} /> Certifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{certs.length} certifications</p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }} onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> Add Certification
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6 space-y-3">
          <h3 className="text-sm font-semibold">New Certification</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-muted-foreground">Certification Name *</label><Input className="h-9 text-sm" value={form.certification_name} onChange={e => set('certification_name', e.target.value)} placeholder="OEKO-TEX, GOTS, GRS..." /></div>
            <div><label className="text-[10px] text-muted-foreground">Body</label><Input className="h-9 text-sm" value={form.certification_body} onChange={e => set('certification_body', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Project</label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.project_id} onChange={e => set('project_id', e.target.value)}>
                <option value="">—</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div><label className="text-[10px] text-muted-foreground">Certificate #</label><Input className="h-9 text-sm" value={form.certificate_number} onChange={e => set('certificate_number', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Applied Date</label><Input type="date" className="h-9 text-sm" value={form.applied_date} onChange={e => set('applied_date', e.target.value)} /></div>
            <div><label className="text-[10px] text-muted-foreground">Expiry Date</label><Input type="date" className="h-9 text-sm" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} /></div>
          </div>
          <div><label className="text-[10px] text-muted-foreground">Scope</label><Input className="h-9 text-sm" value={form.scope} onChange={e => set('scope', e.target.value)} placeholder="Cotton fabrics, all products..." /></div>
          <Button size="sm" className="gap-1" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save
          </Button>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 h-9 text-sm" placeholder="Search certification..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><p className="text-sm text-muted-foreground">No certifications found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const cfg = CERT_STATUS_CONFIG[c.status] || CERT_STATUS_CONFIG.pending
            const expiry = getExpiryStatus(c.expiry_date)
            return (
              <div key={c.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{c.certification_name}</span>
                    <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} className="text-[10px]">{cfg.label}</Badge>
                    {c.expiry_date && <Badge style={{ backgroundColor: expiry.bg, color: expiry.color }} className="text-[10px]">{expiry.label}</Badge>}
                  </div>
                  {c.certificate_number && <span className="text-xs font-mono text-muted-foreground">{c.certificate_number}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {[c.certification_body, c.projects?.name, c.scope].filter(Boolean).join(' · ')}
                  {c.expiry_date ? ` · Expires: ${c.expiry_date}` : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
