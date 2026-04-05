'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Camera, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AUDIT_CHECKPOINTS, SECTION_LABELS, calculateAuditScore, type AuditCheckpointResponse, type AuditRating } from '@/lib/audit-checkpoints'

const RATING_OPTIONS: { value: AuditRating; label: string; color: string; bg: string }[] = [
  { value: 'G', label: 'Green', color: '#085041', bg: '#E1F5EE' },
  { value: 'Y', label: 'Yellow', color: '#633806', bg: '#FAEEDA' },
  { value: 'R', label: 'Red', color: '#791F1F', bg: '#FCEBEB' },
  { value: 'NA', label: 'N/A', color: '#666', bg: '#f0f0f0' },
]

function getSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function NewWRAPAuditPage() {
  const router = useRouter()
  const params = useParams()
  const factoryId = params.id as string

  const [factory, setFactory] = useState<{ id: string; name: string } | null>(null)
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ employment: true, health_safety: true, management: true })

  const [form, setForm] = useState({
    auditDate: new Date().toISOString().split('T')[0],
    auditorName: '',
    auditorType: 'brand_inspector',
    auditType: 'initial' as 'initial' | 'follow_up' | 'annual',
    notes: '',
  })

  const [responses, setResponses] = useState<AuditCheckpointResponse[]>(
    AUDIT_CHECKPOINTS.map(cp => ({
      checkpoint_number: cp.number,
      section: cp.section,
      wrap_principle: cp.wrap_principle,
      description: cp.description,
      rating: null,
      notes: '',
      corrective_action: '',
      corrective_deadline: '',
    }))
  )

  useEffect(() => {
    (async () => {
      const ctxRes = await fetch('/api/user/context')
      if (ctxRes.ok) {
        const ctx = await ctxRes.json()
        setOrgId(ctx.orgId)
        setUserId(ctx.userId)
        setForm(f => ({ ...f, auditorName: ctx.fullName || '' }))
      }
      const supabase = getSupabase()
      const { data } = await (supabase.from('factories') as any).select('id, name').eq('id', factoryId).single()
      if (data) setFactory(data)
    })()
  }, [factoryId])

  const updateResponse = (idx: number, patch: Partial<AuditCheckpointResponse>) => {
    setResponses(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  const score = calculateAuditScore(responses)
  const ratedCount = responses.filter(r => r.rating !== null).length
  const totalCheckpoints = responses.length

  const handleSubmit = async () => {
    if (!form.auditorName) { toast.error('Auditor name is required'); return }
    if (ratedCount < totalCheckpoints) { toast.error(`Rate all checkpoints (${ratedCount}/${totalCheckpoints} rated)`); return }
    // Check corrective actions for Y and R
    for (const r of responses) {
      if ((r.rating === 'Y' || r.rating === 'R') && !r.corrective_action.trim()) {
        toast.error(`Corrective action required for checkpoint ${r.checkpoint_number} (${r.wrap_principle})`)
        return
      }
    }

    setSaving(true)
    try {
      const supabase = getSupabase()

      const { data: audit, error: auditError } = await (supabase.from('factory_audits') as any).insert({
        org_id: orgId,
        factory_id: factoryId,
        auditor_id: userId,
        audit_date: form.auditDate,
        audit_type: form.auditType,
        auditor_type: form.auditorType,
        auditor_name: form.auditorName,
        status: 'completed',
        total_score: score.score,
        result: score.result,
        g_count: score.gCount,
        y_count: score.yCount,
        r_count: score.rCount,
        na_count: score.naCount,
        key_findings: form.notes || null,
      }).select().single()

      if (auditError) throw new Error(auditError.message)

      // Save checkpoint responses
      if (audit) {
        await (supabase.from('audit_responses') as any).insert(
          responses.map(r => ({
            audit_id: audit.id,
            checkpoint_number: r.checkpoint_number,
            section: r.section,
            wrap_principle: r.wrap_principle,
            description: r.description,
            rating: r.rating,
            notes: r.notes || null,
            corrective_action: r.corrective_action || null,
            corrective_deadline: r.corrective_deadline || null,
          }))
        )

        // Update factory's latest audit score
        await (supabase.from('factories') as any).update({
          latest_audit_score: score.score,
          latest_audit_date: form.auditDate,
          latest_audit_result: score.result,
        }).eq('id', factoryId)
      }

      toast.success(`Audit completed — ${score.result} (${score.score}%)`)
      router.push(`/factories/${factoryId}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save audit')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const inputStyle = 'w-full px-3 py-2 bg-[var(--input)] border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary'

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">WRAP Compliance Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">{factory?.name || 'Loading...'} — 35-point assessment</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color: score.score >= 85 ? '#16a34a' : score.score >= 70 ? '#d97706' : ratedCount > 0 ? '#dc2626' : 'var(--muted-foreground)' }}>
            {ratedCount > 0 ? `${score.score}%` : '—'}
          </div>
          <div className="text-xs text-muted-foreground">{ratedCount}/{totalCheckpoints} rated</div>
        </div>
      </div>

      {/* Audit Info */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Date</label>
            <input type="date" className={inputStyle} value={form.auditDate} onChange={e => setForm(f => ({ ...f, auditDate: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Auditor</label>
            <input className={inputStyle} value={form.auditorName} onChange={e => setForm(f => ({ ...f, auditorName: e.target.value }))} placeholder="Full name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Audit Type</label>
            <select className={inputStyle} value={form.auditType} onChange={e => setForm(f => ({ ...f, auditType: e.target.value as any }))}>
              <option value="initial">Initial</option>
              <option value="follow_up">Follow-up</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Auditor Type</label>
            <select className={inputStyle} value={form.auditorType} onChange={e => setForm(f => ({ ...f, auditorType: e.target.value }))}>
              <option value="brand_inspector">Brand Inspector</option>
              <option value="third_party">Third-party Agency</option>
              <option value="internal_qc">Internal QC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Score Summary */}
      {ratedCount > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Green (Compliant)', count: score.gCount, bg: '#E1F5EE', color: '#085041' },
            { label: 'Yellow (Minor)', count: score.yCount, bg: '#FAEEDA', color: '#633806' },
            { label: 'Red (Major)', count: score.rCount, bg: '#FCEBEB', color: '#791F1F' },
            { label: 'N/A', count: score.naCount, bg: '#f0f0f0', color: '#666' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border p-3 text-center" style={{ background: s.bg }}>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[10px] font-medium" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Checkpoint Sections */}
      {(['employment', 'health_safety', 'management'] as const).map(section => {
        const sectionResponses = responses.filter(r => r.section === section)
        const sectionRated = sectionResponses.filter(r => r.rating !== null).length
        const expanded = expandedSections[section]

        return (
          <div key={section} className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection(section)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">{SECTION_LABELS[section]}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{sectionRated}/{sectionResponses.length} checkpoints rated</p>
              </div>
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {expanded && (
              <div className="border-t border-border divide-y divide-border">
                {sectionResponses.map((resp, _) => {
                  const globalIdx = responses.findIndex(r => r.checkpoint_number === resp.checkpoint_number && r.section === resp.section)
                  const needsCorrective = resp.rating === 'Y' || resp.rating === 'R'

                  return (
                    <div key={resp.checkpoint_number} className={cn('p-4', resp.rating === 'R' && 'bg-red-50/50 dark:bg-red-950/10')}>
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-6 flex-shrink-0 pt-0.5">{resp.checkpoint_number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">{resp.wrap_principle}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{resp.description}</p>

                          {/* Rating buttons */}
                          <div className="flex gap-1.5 mt-2">
                            {RATING_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateResponse(globalIdx, { rating: opt.value })}
                                className={cn('px-3 py-1 rounded-md text-xs font-semibold transition-all border',
                                  resp.rating === opt.value ? 'border-transparent' : 'border-border bg-transparent'
                                )}
                                style={resp.rating === opt.value ? { background: opt.bg, color: opt.color } : { color: 'var(--muted-foreground)' }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>

                          {/* Notes */}
                          <input
                            className="mt-2 w-full px-2.5 py-1.5 bg-muted/50 border border-border rounded-md text-xs outline-none focus:border-primary"
                            placeholder="Notes (optional)"
                            value={resp.notes}
                            onChange={e => updateResponse(globalIdx, { notes: e.target.value })}
                          />

                          {/* Corrective action (required for Y and R) */}
                          {needsCorrective && (
                            <div className="mt-2 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10">
                              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-1.5">Corrective action required</p>
                              <textarea
                                className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-xs outline-none resize-none focus:border-primary"
                                rows={2}
                                placeholder="Describe corrective action..."
                                value={resp.corrective_action}
                                onChange={e => updateResponse(globalIdx, { corrective_action: e.target.value })}
                              />
                              <input
                                type="date"
                                className="mt-1.5 px-2.5 py-1.5 bg-background border border-border rounded-md text-xs outline-none focus:border-primary"
                                value={resp.corrective_deadline}
                                onChange={e => updateResponse(globalIdx, { corrective_deadline: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Overall Notes */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Key Findings / Overall Notes</label>
        <textarea
          className={cn(inputStyle, 'min-h-[80px] resize-vertical')}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Summary of key findings, recommendations..."
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <div>
          {ratedCount === totalCheckpoints && (
            <Badge className={cn('text-xs',
              score.result === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
              score.result === 'conditional' ? 'bg-amber-500/10 text-amber-600' :
              'bg-red-500/10 text-red-600'
            )}>
              Result: {score.result === 'approved' ? 'Approved' : score.result === 'conditional' ? 'Conditional' : 'Failed'} — {score.score}%
            </Badge>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={saving || ratedCount < totalCheckpoints} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Submit Audit'}
        </Button>
      </div>
    </div>
  )
}
