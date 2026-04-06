'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  AUDIT_STATUS_CONFIG, AUDIT_TYPE_CONFIG, RATING_CONFIG, getExpiryStatus,
  type FactoryAudit, type AuditStatus, type AuditRating, type AuditType,
} from '@/lib/types/compliance'
import { updateAudit } from '@/lib/actions/compliance'

interface Props { audit: FactoryAudit; canManage: boolean }

const RATINGS: AuditRating[] = ['A', 'B', 'C', 'D', 'F', 'pass', 'fail', 'conditional']

export function AuditDetailClient({ audit, canManage }: Props) {
  const sCfg = AUDIT_STATUS_CONFIG[audit.status] || AUDIT_STATUS_CONFIG.scheduled
  const rCfg = audit.overall_rating ? RATING_CONFIG[audit.overall_rating] : null
  const expiry = getExpiryStatus(audit.certificate_expiry)

  const [form, setForm] = useState({
    status: audit.status,
    overall_rating: audit.overall_rating || '',
    score: String(audit.score || ''),
    critical_findings: String(audit.critical_findings || '0'),
    major_findings: String(audit.major_findings || '0'),
    minor_findings: String(audit.minor_findings || '0'),
    corrective_action_deadline: audit.corrective_action_deadline || '',
    certificate_expiry: audit.certificate_expiry || '',
    notes: audit.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const critical = parseInt(form.critical_findings) || 0
    const major = parseInt(form.major_findings) || 0
    const minor = parseInt(form.minor_findings) || 0
    const result = await updateAudit(audit.id, {
      status: form.status,
      overall_rating: form.overall_rating || undefined,
      score: form.score ? parseFloat(form.score) : undefined,
      findings_count: critical + major + minor,
      critical_findings: critical,
      major_findings: major,
      minor_findings: minor,
      corrective_action_deadline: form.corrective_action_deadline || undefined,
      certificate_expiry: form.certificate_expiry || undefined,
      notes: form.notes,
    })
    setSaving(false)
    if (result.success) toast.success('Audit updated')
    else toast.error('Failed', { description: result.error })
  }

  return (
    <div>
      <Link href="/compliance/audits" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Audits
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{audit.factories?.name || 'Factory Audit'}</h1>
            <Badge variant="secondary" className="text-[10px] capitalize">{AUDIT_TYPE_CONFIG[audit.audit_type as AuditType]?.label}</Badge>
            <Badge style={{ backgroundColor: sCfg.bg, color: sCfg.color }}>{sCfg.label}</Badge>
            {rCfg && <span className="text-lg font-bold" style={{ color: rCfg.color }}>{rCfg.label}</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[audit.audit_standard, audit.auditor_name, audit.auditor_organization].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Findings summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold text-red-600">{audit.critical_findings}</p>
          <p className="text-[10px] text-muted-foreground">Critical</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold text-orange-500">{audit.major_findings}</p>
          <p className="text-[10px] text-muted-foreground">Major</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold text-yellow-600">{audit.minor_findings}</p>
          <p className="text-[10px] text-muted-foreground">Minor</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          {audit.certificate_expiry ? (
            <Badge style={{ backgroundColor: expiry.bg, color: expiry.color }} className="text-[10px]">{expiry.label}</Badge>
          ) : <p className="text-sm text-muted-foreground">—</p>}
          <p className="text-[10px] text-muted-foreground mt-1">Certificate</p>
        </div>
      </div>

      {/* Edit form */}
      {canManage && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold">Update Audit</h3>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground">Status</label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AuditStatus }))}>
                {Object.entries(AUDIT_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground">Rating</label>
              <select className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" value={form.overall_rating} onChange={e => setForm(f => ({ ...f, overall_rating: e.target.value }))}>
                <option value="">—</option>{RATINGS.map(r => <option key={r} value={r}>{RATING_CONFIG[r].label}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground">Score (%)</label>
              <Input type="number" step="0.01" className="h-9 text-sm" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground">Critical Findings</label>
              <Input type="number" className="h-9 text-sm" value={form.critical_findings} onChange={e => setForm(f => ({ ...f, critical_findings: e.target.value }))} /></div>
            <div><label className="text-xs text-muted-foreground">Major Findings</label>
              <Input type="number" className="h-9 text-sm" value={form.major_findings} onChange={e => setForm(f => ({ ...f, major_findings: e.target.value }))} /></div>
            <div><label className="text-xs text-muted-foreground">Minor Findings</label>
              <Input type="number" className="h-9 text-sm" value={form.minor_findings} onChange={e => setForm(f => ({ ...f, minor_findings: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-muted-foreground">CAR Deadline</label>
              <Input type="date" className="h-9 text-sm" value={form.corrective_action_deadline} onChange={e => setForm(f => ({ ...f, corrective_action_deadline: e.target.value }))} /></div>
            <div><label className="text-xs text-muted-foreground">Certificate Expiry</label>
              <Input type="date" className="h-9 text-sm" value={form.certificate_expiry} onChange={e => setForm(f => ({ ...f, certificate_expiry: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs text-muted-foreground">Notes</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm min-h-[60px] resize-vertical" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving} style={{ backgroundColor: '#D4A843' }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="bg-card rounded-xl border border-border p-5 mt-4">
        <h3 className="text-sm font-semibold mb-3">Audit Details</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[['Date', audit.audit_date], ['Next Audit', audit.next_audit_date], ['Auditor', audit.auditor_name], ['Organization', audit.auditor_organization], ['Standard', audit.audit_standard]].map(([l, v]) => (
            <div key={l as string} className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">{l}</span><span className="font-medium">{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
