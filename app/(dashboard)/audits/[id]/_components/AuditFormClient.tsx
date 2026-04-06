'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Save, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { calculateAuditScore } from '@/lib/utils/audit-scoring'
import {
  RATING_CONFIG, VERDICT_CONFIG, AUDIT_V2_STATUS_CONFIG, AUDIT_V2_TYPE_CONFIG,
  type FactoryAuditV2, type AuditRating, type AuditRatingValue, type AuditVerdict,
  type AuditTemplateSection, type AuditTemplateCheckpoint,
} from '@/lib/types/audits'
import { updateAuditRating, submitAudit } from '@/lib/actions/audits'

interface Props {
  audit: FactoryAuditV2
  ratings: AuditRating[]
  sections: (AuditTemplateSection & { audit_template_checkpoints: AuditTemplateCheckpoint[] })[]
  canManage: boolean
}

const RATING_VALUES: AuditRatingValue[] = ['G', 'Y', 'R', 'NA']

export function AuditFormClient({ audit, ratings, sections, canManage }: Props) {
  const sCfg = AUDIT_V2_STATUS_CONFIG[audit.status]
  const isEditable = canManage && (audit.status === 'draft' || audit.status === 'in_progress')

  // Build rating state: checkpointId -> rating value
  const [ratingState, setRatingState] = useState<Record<string, AuditRatingValue | null>>(
    Object.fromEntries(ratings.map(r => [r.checkpoint_id, r.rating as AuditRatingValue | null]))
  )
  const [notesState, setNotesState] = useState<Record<string, string>>(
    Object.fromEntries(ratings.map(r => [r.checkpoint_id, r.notes || '']))
  )
  const [carState, setCarState] = useState<Record<string, string>>(
    Object.fromEntries(ratings.map(r => [r.checkpoint_id, r.corrective_action || '']))
  )
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map(s => [s.id, true]))
  )
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [spcRequired, setSpcRequired] = useState(true)

  // Rating ID map: checkpointId -> ratingId
  const ratingIdMap = useMemo(() => Object.fromEntries(ratings.map(r => [r.checkpoint_id, r.id])), [ratings])

  // Section map for scoring
  const sectionMap = useMemo(() => {
    const map: Record<string, { sectionId: string; sectionName: string }> = {}
    sections.forEach(s => {
      s.audit_template_checkpoints.forEach(cp => {
        map[cp.id] = { sectionId: s.id, sectionName: s.short_name || s.section_name }
      })
    })
    return map
  }, [sections])

  const score = useMemo(() => calculateAuditScore(ratingState, sectionMap), [ratingState, sectionMap])

  const handleRating = useCallback(async (checkpointId: string, rating: AuditRatingValue) => {
    setRatingState(prev => ({ ...prev, [checkpointId]: rating }))
    if (rating === 'R') setExpandedNotes(prev => ({ ...prev, [checkpointId]: true }))

    const ratingId = ratingIdMap[checkpointId]
    if (!ratingId) return

    setSaving(checkpointId)
    await updateAuditRating(ratingId, audit.id, {
      rating,
      notes: notesState[checkpointId] || undefined,
      corrective_action: carState[checkpointId] || undefined,
    })
    setSaving(null)
  }, [ratingIdMap, audit.id, notesState, carState])

  const handleSaveNotes = async (checkpointId: string) => {
    const ratingId = ratingIdMap[checkpointId]
    if (!ratingId) return
    setSaving(checkpointId)
    await updateAuditRating(ratingId, audit.id, {
      rating: ratingState[checkpointId] || 'R',
      notes: notesState[checkpointId] || undefined,
      corrective_action: carState[checkpointId] || undefined,
    })
    setSaving(null)
    toast.success('Notes saved')
  }

  const handleSPCToggle = (required: boolean) => {
    setSpcRequired(required)
    if (!required) {
      // Auto-set SPC items to NA
      sections.forEach(s => {
        s.audit_template_checkpoints.forEach(cp => {
          if (cp.condition_group === 'spc') {
            setRatingState(prev => ({ ...prev, [cp.id]: 'NA' }))
            const rid = ratingIdMap[cp.id]
            if (rid) updateAuditRating(rid, audit.id, { rating: 'NA' })
          }
        })
      })
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const result = await submitAudit(audit.id)
    setSubmitting(false)
    if (result.success) toast.success('Audit submitted')
    else toast.error('Cannot submit', { description: result.error })
  }

  const verdictCfg = score.overallScore > 0 ? VERDICT_CONFIG[score.verdict] : null
  const scoreColor = score.overallScore >= 90 ? '#2E7D32' : score.overallScore >= 75 ? '#F59E0B' : score.overallScore >= 50 ? '#E65100' : '#CC0000'

  return (
    <div>
      <Link href="/audits" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Audits
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Main content */}
        <div>
          {/* Header */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-lg font-bold">{audit.audit_number}</h1>
              <Badge style={{ backgroundColor: sCfg.bg, color: sCfg.color }} className="text-[10px]">{sCfg.label}</Badge>
              <Badge variant="secondary" className="text-[10px]">{AUDIT_V2_TYPE_CONFIG[audit.audit_type]?.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {audit.factories?.name} {audit.factories?.city ? `· ${audit.factories.city}, ${audit.factories.country}` : ''} · {audit.audit_date} · {audit.auditor_name}
            </p>
          </div>

          {/* Sections */}
          {sections.map(section => {
            const isExpanded = expandedSections[section.id]
            const sectionScore = score.sectionScores.find(s => s.sectionId === section.id)
            return (
              <div key={section.id} className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
                <button
                  onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="text-sm font-semibold">{section.short_name || section.section_name}</span>
                    <span className="text-[10px] text-muted-foreground">({section.audit_template_checkpoints.length} items)</span>
                  </div>
                  {sectionScore && (
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-green-600">{sectionScore.greenCount}G</span>
                      <span className="text-yellow-500">{sectionScore.yellowCount}Y</span>
                      <span className="text-red-600">{sectionScore.redCount}R</span>
                      <span className="text-gray-400">{sectionScore.naCount}NA</span>
                      <span className="font-mono font-bold ml-1">{sectionScore.score}%</span>
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {section.conditional_note && (
                      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs">
                        <span className="text-amber-700">{section.conditional_note}</span>
                        <div className="flex gap-1 ml-auto">
                          <button onClick={() => handleSPCToggle(true)} className={cn('px-2 py-0.5 rounded text-[10px] font-medium', spcRequired ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground')}>Yes</button>
                          <button onClick={() => handleSPCToggle(false)} className={cn('px-2 py-0.5 rounded text-[10px] font-medium', !spcRequired ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground')}>No</button>
                        </div>
                      </div>
                    )}
                    {section.audit_template_checkpoints.map(cp => {
                      const currentRating = ratingState[cp.id]
                      const isNA = currentRating === 'NA'
                      const isRed = currentRating === 'R'
                      const showNotes = expandedNotes[cp.id] || isRed
                      const isSPCDisabled = cp.condition_group === 'spc' && !spcRequired

                      return (
                        <div key={cp.id} className={cn('border-b border-border last:border-0', isNA && 'opacity-50')}>
                          <div className="px-4 py-2.5 flex items-start gap-3">
                            <span className="text-[10px] font-mono text-muted-foreground mt-1 w-5 flex-shrink-0">{cp.item_number}</span>
                            <p className="text-xs text-foreground flex-1 leading-relaxed">{cp.checkpoint_text}</p>
                            <div className="flex gap-1 flex-shrink-0">
                              {RATING_VALUES.map(rv => {
                                const cfg = RATING_CONFIG[rv]
                                const isSelected = currentRating === rv
                                return (
                                  <button
                                    key={rv}
                                    onClick={() => isEditable && !isSPCDisabled && handleRating(cp.id, rv)}
                                    disabled={!isEditable || isSPCDisabled}
                                    className={cn(
                                      'w-9 h-7 rounded text-[11px] font-bold transition-all',
                                      isSelected ? 'text-white shadow-sm' : 'border border-border text-muted-foreground hover:opacity-80',
                                      isSPCDisabled && 'opacity-30 cursor-not-allowed'
                                    )}
                                    style={isSelected ? { backgroundColor: cfg.bg } : {}}
                                  >
                                    {cfg.label}
                                  </button>
                                )
                              })}
                              {saving === cp.id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-1 mt-1.5" />}
                            </div>
                          </div>
                          {showNotes && (
                            <div className="px-4 pb-3 pl-12 space-y-2">
                              <div>
                                <label className="text-[10px] text-muted-foreground">{isRed ? 'Nonconformance Notes *' : 'Notes'}</label>
                                <textarea
                                  className={cn('w-full px-3 py-1.5 rounded-lg border bg-background text-xs min-h-[50px] resize-vertical', isRed ? 'border-red-300' : 'border-border')}
                                  value={notesState[cp.id] || ''}
                                  onChange={e => setNotesState(prev => ({ ...prev, [cp.id]: e.target.value }))}
                                  placeholder={isRed ? 'Describe the nonconformance (required)...' : 'Optional notes...'}
                                  disabled={!isEditable}
                                />
                              </div>
                              {isRed && (
                                <div>
                                  <label className="text-[10px] text-muted-foreground">Corrective Action Required</label>
                                  <textarea
                                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs min-h-[40px] resize-vertical"
                                    value={carState[cp.id] || ''}
                                    onChange={e => setCarState(prev => ({ ...prev, [cp.id]: e.target.value }))}
                                    placeholder="Required corrective action..."
                                    disabled={!isEditable}
                                  />
                                </div>
                              )}
                              {isEditable && (
                                <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 gap-1" onClick={() => handleSaveNotes(cp.id)}>
                                  <Save className="w-3 h-3" /> Save Notes
                                </Button>
                              )}
                            </div>
                          )}
                          {!showNotes && currentRating && !(['NA', 'R'] as string[]).includes(currentRating) && (
                            <div className="px-4 pb-2 pl-12">
                              <button onClick={() => setExpandedNotes(prev => ({ ...prev, [cp.id]: true }))} className="text-[10px] text-muted-foreground hover:text-foreground">
                                + Add notes
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Action bar */}
          {isEditable && (
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="gap-1.5" onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: '#D4A843' }}>
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit Audit
              </Button>
            </div>
          )}

          {audit.status === 'submitted' && (
            <Link href={`/audits/${audit.id}/report`}>
              <Button size="sm" variant="outline" className="mt-4 text-xs">View Report</Button>
            </Link>
          )}
        </div>

        {/* Score sidebar */}
        <div className="space-y-3">
          {/* Score gauge */}
          <div className="bg-card rounded-xl border border-border p-4 text-center sticky top-4">
            <div className="relative w-32 h-32 mx-auto mb-3">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeDasharray={`${score.overallScore * 2.64} 264`}
                  strokeLinecap="round" className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono" style={{ color: scoreColor }}>{score.overallScore}%</span>
              </div>
            </div>
            {verdictCfg && (
              <Badge style={{ backgroundColor: verdictCfg.bg, color: verdictCfg.color }} className="text-xs font-bold px-3 py-1">
                {verdictCfg.label}
              </Badge>
            )}

            {/* Section bars */}
            <div className="mt-4 space-y-2">
              {score.sectionScores.map(ss => (
                <div key={ss.sectionId}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-muted-foreground">{ss.sectionName}</span>
                    <span className="font-mono font-semibold">{ss.score}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{
                      width: `${ss.score}%`,
                      backgroundColor: ss.score >= 90 ? '#2E7D32' : ss.score >= 75 ? '#F59E0B' : ss.score >= 50 ? '#E65100' : '#CC0000'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-4 space-y-1 text-[10px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Rated</span><span className="font-semibold">{score.ratedCount} / {score.totalItems}</span></div>
              <div className="flex justify-between"><span className="text-green-600">Green</span><span className="font-semibold">{score.greenCount}</span></div>
              <div className="flex justify-between"><span className="text-yellow-500">Yellow</span><span className="font-semibold">{score.yellowCount}</span></div>
              <div className="flex justify-between"><span className="text-red-600">Red</span><span className="font-semibold">{score.redCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">N/A</span><span className="font-semibold">{score.naCount}</span></div>
              <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="text-muted-foreground">Items OK</span><span className="font-bold">{score.itemsOK}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Actions Required</span><span className="font-bold text-red-600">{score.actionsRequired}</span></div>
            </div>

            {/* Progress */}
            <div className="mt-3">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-[#D4A843] transition-all" style={{ width: `${(score.ratedCount / score.totalItems) * 100}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{score.ratedCount} of {score.totalItems} checkpoints rated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
