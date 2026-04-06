'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { RATING_CONFIG, VERDICT_CONFIG, type FactoryAuditV2, type AuditRating, type AuditRatingValue, type AuditVerdict, type AuditTemplateSection } from '@/lib/types/audits'

interface Props {
  audit: FactoryAuditV2
  ratings: (AuditRating & { audit_template_checkpoints?: { checkpoint_text: string } })[]
  sections: AuditTemplateSection[]
}

export function AuditReportClient({ audit, ratings, sections }: Props) {
  const vCfg = audit.verdict ? VERDICT_CONFIG[audit.verdict] : null
  const scoreColor = audit.overall_score >= 90 ? '#2E7D32' : audit.overall_score >= 75 ? '#F59E0B' : audit.overall_score >= 50 ? '#E65100' : '#CC0000'
  const redItems = ratings.filter(r => r.rating === 'R')

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/audits/${audit.id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Audit
        </Link>
        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" /> Print Report
        </Button>
      </div>

      {/* Cover */}
      <div className="bg-card rounded-xl border border-border p-6 mb-4 text-center">
        <h1 className="text-lg font-bold mb-1" style={{ color: '#D4A843' }}>SankalphHub Factory Audit Report</h1>
        <p className="text-sm text-muted-foreground">{audit.audit_templates?.template_name}</p>
        <div className="mt-4 space-y-0.5 text-xs">
          <p><span className="text-muted-foreground">Factory:</span> <span className="font-semibold">{audit.factories?.name}</span> — {audit.factories?.city}, {audit.factories?.country}</p>
          <p><span className="text-muted-foreground">Audit Date:</span> {audit.audit_date} · <span className="text-muted-foreground">Auditor:</span> {audit.auditor_name}</p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="text-3xl font-bold font-mono" style={{ color: scoreColor }}>{audit.overall_score}%</span>
          {vCfg && <Badge style={{ backgroundColor: vCfg.bg, color: vCfg.color }} className="text-sm font-bold px-4 py-1">{vCfg.label}</Badge>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-lg font-bold text-green-600">{audit.green_count}</p><p className="text-[10px] text-muted-foreground">Green</p></div>
        <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-lg font-bold text-yellow-500">{audit.yellow_count}</p><p className="text-[10px] text-muted-foreground">Yellow</p></div>
        <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-lg font-bold text-red-600">{audit.red_count}</p><p className="text-[10px] text-muted-foreground">Red</p></div>
        <div className="bg-card rounded-xl border border-border p-3 text-center"><p className="text-lg font-bold text-gray-400">{audit.na_count}</p><p className="text-[10px] text-muted-foreground">N/A</p></div>
      </div>

      {/* Section breakdown */}
      {sections.map(section => {
        const sectionRatings = ratings.filter(r => r.section_id === section.id)
        return (
          <div key={section.id} className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <h3 className="text-sm font-semibold">{section.section_name}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Checkpoint</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground w-16">Rating</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Notes</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {sectionRatings.map(r => {
                    const rCfg = r.rating ? RATING_CONFIG[r.rating as AuditRatingValue] : null
                    return (
                      <tr key={r.id} className={cn(r.rating === 'R' && 'bg-red-50/50')}>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{r.item_number}</td>
                        <td className="px-3 py-2">{r.audit_template_checkpoints?.checkpoint_text || `Item ${r.item_number}`}</td>
                        <td className="px-3 py-2 text-center">
                          {rCfg ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: rCfg.bg, color: rCfg.color }}>{rCfg.label}</span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{r.notes || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Non-conformance report */}
      {redItems.length > 0 && (
        <div className="bg-card rounded-xl border-2 border-red-200 mb-3 overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-200">
            <h3 className="text-sm font-semibold text-red-700">Non-Conformance Report ({redItems.length} items)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-8">#</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Checkpoint</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Notes</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Corrective Action</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {redItems.map(r => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-mono">{r.item_number}</td>
                    <td className="px-3 py-2">{r.audit_template_checkpoints?.checkpoint_text || `Item ${r.item_number}`}</td>
                    <td className="px-3 py-2 text-red-700">{r.notes || '—'}</td>
                    <td className="px-3 py-2">{r.corrective_action || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
