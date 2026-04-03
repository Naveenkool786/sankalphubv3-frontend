'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { BackButton } from '@/components/ui/BackButton'

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

  const totalScore = scores.legal + scores.safety + scores.conditions + scores.capacity + scores.quality + scores.environment
  const result: 'approved' | 'conditional' | 'failed' = totalScore >= 75 ? 'approved' : totalScore >= 50 ? 'conditional' : 'failed'
  const rc = RESULT_CONFIG[result]
  const allSectionsScored = Object.values(scores).every(v => v > 0)

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

  const handleSubmit = async () => {
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
        key_findings: null,
        corrective_actions: null,
        next_audit_due: null,
        status: 'submitted',
      }).select().single()

      if (error) { toast.error(error.message); setSubmitting(false); return }

      // 2. Update factory
      if (audit) {
        const updateData: any = {
          latest_audit_score: audit.total_score,
          latest_audit_date: audit.audit_date,
          latest_audit_result: audit.result,
        }
        if (audit.result === 'failed') updateData.status = 'under_review'
        await (supabase.from('factories') as any).update(updateData).eq('id', form.factoryId)
      }

      toast.success('Audit submitted \u2014 score published')
      router.push('/factories')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save audit')
    } finally {
      setSubmitting(false)
    }
  }

  const cardStyle: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '14px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '13px', outline: 'none' }
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }

  return (
    <div className="p-6 lg:p-8 ">
      <BackButton href="/audits/factory" label="Back to Factory Audits" />

      <h1 className="text-xl font-bold text-foreground mb-1">Factory Audit</h1>
      <p className="text-sm text-muted-foreground mb-6">Step-by-step audit of a manufacturing facility</p>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch', width: '100%', marginBottom: '16px' }}>

        {/* ── LEFT: Audit Details ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', border: '0.5px solid var(--border)', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>Audit Details</div>

            <div>
              <label style={labelStyle}>Factory *</label>
              <select style={{ ...inputStyle, appearance: 'auto' as any }} value={form.factoryId} onChange={e => setForm(f => ({ ...f, factoryId: e.target.value }))}>
                <option value="">Select factory</option>
                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Inspector name *</label>
              <input style={inputStyle} value={form.auditorName} onChange={e => setForm(f => ({ ...f, auditorName: e.target.value }))} placeholder="Full name" />
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: '8px' }}>Audit type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { v: 'initial', label: 'Initial audit' },
                  { v: 'follow_up', label: 'Follow-up' },
                  { v: 'annual', label: 'Annual re-audit' },
                ].map(t => (
                  <button key={t.v} type="button" onClick={() => setForm(f => ({ ...f, auditType: t.v }))}
                    style={{
                      padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                      border: form.auditType === t.v ? '1.5px solid #C9A96E' : '0.5px solid var(--border)',
                      background: form.auditType === t.v ? '#FAEEDA' : 'var(--background)',
                      color: form.auditType === t.v ? '#633806' : 'var(--muted-foreground)',
                      transition: 'all .15s',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Date + Inspector type + Section Scores + Total ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--card)', borderRadius: '12px', border: '0.5px solid var(--border)', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Audit date + Inspector type — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Audit date *</label>
                <input style={inputStyle} type="date" value={form.auditDate} onChange={e => setForm(f => ({ ...f, auditDate: e.target.value }))} />
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

            {/* Divider */}
            <div style={{ height: '0.5px', background: 'var(--border)' }} />

            {/* Section scores header */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>Section scores</div>
              <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Score each section — total calculated automatically</div>
            </div>

            {/* 6 section score rows */}
            {SECTIONS.map(s => {
              const val = scores[s.key]
              const pct = (val / s.max) * 100
              const barColor = pct >= 75 ? '#1D9E75' : pct >= 50 ? '#BA7517' : '#E24B4A'
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--muted)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{s.subtitle}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="number" min={0} max={s.max} value={val}
                      onChange={e => setScores(prev => ({ ...prev, [s.key]: Math.min(s.max, Math.max(0, parseInt(e.target.value) || 0)) }))}
                      style={{ width: '50px', height: '34px', textAlign: 'center', borderRadius: '7px', border: '0.5px solid var(--border)', fontSize: '13px', fontWeight: 500, background: 'var(--background)' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', minWidth: '28px' }}>/{s.max}</span>
                  </div>
                </div>
              )
            })}

            {/* Total score — bottom of right card */}
            <div style={{
              marginTop: 'auto', padding: '12px 16px', borderRadius: '10px',
              background: rc.bg, border: `1.5px solid ${rc.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: rc.color }}>Total audit score</div>
                <div style={{ fontSize: '11px', color: rc.color }}>{rc.label}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 500, color: rc.color }}>{totalScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit button — bottom right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          disabled={submitting || !allSectionsScored}
          onClick={handleSubmit}
          style={{
            padding: '8px 24px', borderRadius: '8px',
            background: submitting ? '#888' : allSectionsScored ? '#1D9E75' : '#D3D1C7',
            color: allSectionsScored ? '#fff' : 'var(--muted-foreground)',
            border: 'none', fontSize: '13px', fontWeight: 500,
            cursor: allSectionsScored && !submitting ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background .2s',
          }}>
          {submitting ? 'Submitting...' : 'Submit audit \u2192'}
        </button>
      </div>
    </div>
  )
}
