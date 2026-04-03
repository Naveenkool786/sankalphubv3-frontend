'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Upload, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'

const SECTIONS = [
  { key: 'legal', label: 'Legal & compliance', subtitle: 'Licenses, permits, certifications', max: 20 },
  { key: 'safety', label: 'Health & safety', subtitle: 'Fire exits, PPE, emergency procedures', max: 20 },
  { key: 'conditions', label: 'Working conditions', subtitle: 'Hours, wages, worker welfare', max: 20 },
  { key: 'capacity', label: 'Production capacity', subtitle: 'Lines, equipment, output capability', max: 15 },
  { key: 'quality', label: 'Quality systems', subtitle: 'QC processes, defect tracking', max: 15 },
  { key: 'environment', label: 'Environmental', subtitle: 'Waste management, water, emissions', max: 10 },
] as const

type ScoreKey = typeof SECTIONS[number]['key']
type Scores = Record<ScoreKey, number>

const RESULT_CONFIG = {
  approved: { bg: '#E1F5EE', border: '#1D9E75', color: '#085041', label: 'Approved \u2014 factory meets requirements' },
  conditional: { bg: '#FAEEDA', border: '#C9A96E', color: '#633806', label: 'Conditional \u2014 improvements required before next order' },
  failed: { bg: '#FCEBEB', border: '#E24B4A', color: '#791F1F', label: 'Failed \u2014 re-audit required before any orders' },
}

export default function NewFactoryAuditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [factories, setFactories] = useState<{ id: string; name: string }[]>([])
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    factoryId: searchParams.get('factoryId') || '',
    auditDate: new Date().toISOString().split('T')[0],
    auditorName: '',
    auditorType: 'brand_inspector',
    auditType: 'initial',
  })

  const [scores, setScores] = useState<Scores>({ legal: 0, safety: 0, conditions: 0, capacity: 0, quality: 0, environment: 0 })
  const [keyFindings, setKeyFindings] = useState('')
  const [correctiveActions, setCorrectiveActions] = useState('')
  const [nextAuditDue, setNextAuditDue] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const totalScore = scores.legal + scores.safety + scores.conditions + scores.capacity + scores.quality + scores.environment
  const result: 'approved' | 'conditional' | 'failed' = totalScore >= 75 ? 'approved' : totalScore >= 50 ? 'conditional' : 'failed'
  const rc = RESULT_CONFIG[result]

  function getSupabase() {
    return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  // Load factories
  useEffect(() => {
    (async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      const oid = (profile as any)?.org_id
      if (!oid) return
      setOrgId(oid)
      const { data } = await (supabase.from('factories') as any).select('id, name').eq('org_id', oid).eq('is_active', true).order('name')
      if (data) setFactories(data)
    })()
  }, [])

  const handleSubmit = async (asDraft: boolean) => {
    if (!form.factoryId) { toast.error('Select a factory'); return }
    if (!form.auditorName.trim()) { toast.error('Inspector name is required'); return }
    setSubmitting(true)

    try {
      const supabase = getSupabase()

      // 1. Save audit
      const { data: audit, error } = await (supabase.from('factory_audits') as any).insert({
        org_id: orgId,
        factory_id: form.factoryId,
        audited_by: userId,
        auditor_name: form.auditorName.trim(),
        auditor_type: form.auditorType,
        audit_type: form.auditType,
        audit_date: form.auditDate,
        score_legal: scores.legal,
        score_safety: scores.safety,
        score_conditions: scores.conditions,
        score_capacity: scores.capacity,
        score_quality: scores.quality,
        score_environment: scores.environment,
        key_findings: keyFindings || null,
        corrective_actions: correctiveActions || null,
        next_audit_due: nextAuditDue || null,
        status: asDraft ? 'draft' : 'submitted',
      }).select().single()

      if (error) { toast.error(error.message); setSubmitting(false); return }

      // 2. Upload PDF
      if (pdfFile && audit) {
        const { data: fileData } = await supabase.storage
          .from('audit-reports')
          .upload(`${audit.id}/report.pdf`, pdfFile, { upsert: true })
        if (fileData) {
          await (supabase.from('factory_audits') as any)
            .update({ report_url: fileData.path })
            .eq('id', audit.id)
        }
      }

      // 3. Update factory (only if submitted, not draft)
      if (!asDraft && audit) {
        const updateData: any = {
          latest_audit_score: audit.total_score,
          latest_audit_date: audit.audit_date,
          latest_audit_result: audit.result,
        }
        if (audit.result === 'failed') updateData.status = 'under_review'
        await (supabase.from('factories') as any).update(updateData).eq('id', form.factoryId)
      }

      toast.success(asDraft ? 'Draft saved' : 'Audit submitted \u2014 score published')
      router.push('/factories')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save audit')
    } finally {
      setSubmitting(false)
    }
  }

  const cardStyle: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', marginBottom: '14px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }

  return (
    <div className="p-6 lg:p-8 ">
      <button onClick={() => router.push('/factories')} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Factories
      </button>

      <h1 className="text-xl font-bold text-foreground mb-1">Factory Audit</h1>
      <p className="text-sm text-muted-foreground mb-6">Step-by-step audit of a manufacturing facility</p>

      {/* ── Card 1: Audit Details ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Audit Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Factory *</label>
            <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.factoryId} onChange={e => setForm(f => ({ ...f, factoryId: e.target.value }))}>
              <option value="">Select factory</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Audit date *</label>
            <input style={inputStyle} type="date" value={form.auditDate} onChange={e => setForm(f => ({ ...f, auditDate: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Inspector name *</label>
            <input style={inputStyle} value={form.auditorName} onChange={e => setForm(f => ({ ...f, auditorName: e.target.value }))} placeholder="Full name" />
          </div>
          <div>
            <label style={labelStyle}>Inspector type</label>
            <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.auditorType} onChange={e => setForm(f => ({ ...f, auditorType: e.target.value }))}>
              <option value="brand_inspector">Brand inspector</option>
              <option value="third_party">Third-party agency</option>
              <option value="internal_qc">Internal QC</option>
            </select>
          </div>
        </div>

        {/* Audit type toggle */}
        <div style={{ marginTop: '14px' }}>
          <label style={labelStyle}>Audit type</label>
          <div className="flex gap-2">
            {[
              { v: 'initial', label: 'Initial audit' },
              { v: 'follow_up', label: 'Follow-up' },
              { v: 'annual', label: 'Annual re-audit' },
            ].map(t => (
              <button key={t.v} type="button" onClick={() => setForm(f => ({ ...f, auditType: t.v }))}
                style={{
                  padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  border: form.auditType === t.v ? '1.5px solid #C9A96E' : '1px solid var(--border)',
                  background: form.auditType === t.v ? '#FAEEDA' : 'transparent',
                  color: form.auditType === t.v ? '#633806' : 'var(--muted-foreground)',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card 2: Section Scores ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Section Scores</h2>
        <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
          Score each section &mdash; total is calculated automatically
        </p>

        {SECTIONS.map(s => {
          const val = scores[s.key]
          const pct = (val / s.max) * 100
          const barColor = pct >= 75 ? '#1D9E75' : pct >= 50 ? '#BA7517' : '#E24B4A'
          return (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '8px 10px', background: 'var(--muted)', borderRadius: '7px', marginBottom: '6px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '2px' }}>{s.label}</div>
                <div style={{ fontSize: '9px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>{s.subtitle}</div>
                <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: '2px', background: barColor, transition: 'width .3s, background .3s' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <input type="number" min={0} max={s.max} value={val}
                  onChange={e => setScores(prev => ({ ...prev, [s.key]: Math.min(s.max, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  style={{ width: '52px', height: '32px', textAlign: 'center', borderRadius: '6px', border: '0.5px solid var(--border)', fontSize: '13px', fontWeight: 500, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>/{s.max}</span>
              </div>
            </div>
          )
        })}

        {/* Total score box */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: '8px',
          border: `1.5px solid ${rc.border}`, background: rc.bg, marginTop: '10px',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: rc.color }}>Total audit score</div>
            <div style={{ fontSize: '10px', color: rc.color, opacity: 0.8 }}>{rc.label}</div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 500, color: rc.color }}>{totalScore}%</div>
        </div>
      </div>

      {/* ── Card 3: Report + Findings ── */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Report &amp; Findings</h2>

        {/* PDF upload */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Upload audit report (PDF)</label>
          {pdfFile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--muted)', borderRadius: '8px' }}>
              <FileText className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontSize: '12px', color: 'var(--foreground)', flex: 1 }}>{pdfFile.name}</span>
              <button onClick={() => setPdfFile(null)} style={{ fontSize: '10px', color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
            </div>
          ) : (
            <div onClick={() => pdfInputRef.current?.click()}
              style={{ border: '1.5px dashed var(--border)', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: 'var(--muted)' }}>
              <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ fontSize: '11px', color: 'var(--foreground)' }}>Drop PDF or click to upload</p>
              <p style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>PDF only &middot; max 20MB</p>
            </div>
          )}
          <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { if (f.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return }; setPdfFile(f) } }} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Key findings</label>
          <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={keyFindings} onChange={e => setKeyFindings(e.target.value)} placeholder="Summary of key observations..." />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Corrective actions</label>
          <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={correctiveActions} onChange={e => setCorrectiveActions(e.target.value)} placeholder="List improvements required..." />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Next audit due</label>
          <input style={inputStyle} type="date" value={nextAuditDue} onChange={e => setNextAuditDue(e.target.value)} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button disabled={submitting} onClick={() => handleSubmit(true)}
            style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            Save draft
          </button>
          <button disabled={submitting} onClick={() => handleSubmit(false)}
            style={{ flex: 2, padding: '10px', background: submitting ? '#888' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Submitting...' : 'Submit audit \u2192 publish score'}
          </button>
        </div>
      </div>
    </div>
  )
}
