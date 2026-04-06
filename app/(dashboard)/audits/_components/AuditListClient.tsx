'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardCheck, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { VERDICT_CONFIG, AUDIT_V2_STATUS_CONFIG, AUDIT_V2_TYPE_CONFIG, type FactoryAuditV2, type AuditVerdict, type AuditV2Status, type AuditV2Type } from '@/lib/types/audits'

interface Props { audits: FactoryAuditV2[]; canManage: boolean }

export function AuditListClient({ audits, canManage }: Props) {
  const [search, setSearch] = useState('')
  const [verdictFilter, setVerdictFilter] = useState<string>('all')

  const filtered = audits.filter(a => {
    const matchSearch = !search || [a.audit_number, a.factories?.name, a.auditor_name].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchVerdict = verdictFilter === 'all' || a.verdict === verdictFilter
    return matchSearch && matchVerdict
  })

  const totalAudits = audits.length
  const avgScore = audits.length > 0 ? Math.round(audits.reduce((s, a) => s + a.overall_score, 0) / audits.length) : 0
  const passedCount = audits.filter(a => a.verdict === 'passed').length
  const actionCount = audits.filter(a => a.verdict === 'warning' || a.verdict === 'failed').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" style={{ color: '#D4A843' }} /> Factory Audits
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{audits.length} audits</p>
        </div>
        {canManage && (
          <Link href="/audits/new">
            <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }}>
              <Plus className="w-4 h-4" /> Start New Audit
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold">{totalAudits}</p><p className="text-[10px] text-muted-foreground">Total Audits</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold">{avgScore}%</p><p className="text-[10px] text-muted-foreground">Avg Score</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold text-green-600">{passedCount}</p><p className="text-[10px] text-muted-foreground">Passed</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-lg font-bold text-red-600">{actionCount}</p><p className="text-[10px] text-muted-foreground">Need Action</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search audit #, factory..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={verdictFilter} onChange={e => setVerdictFilter(e.target.value)}>
          <option value="all">All Verdicts</option>
          {Object.entries(VERDICT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <ClipboardCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No audits found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const vCfg = a.verdict ? VERDICT_CONFIG[a.verdict] : null
            const sCfg = AUDIT_V2_STATUS_CONFIG[a.status] || AUDIT_V2_STATUS_CONFIG.draft
            const scoreColor = a.overall_score >= 90 ? 'text-green-600' : a.overall_score >= 75 ? 'text-yellow-600' : a.overall_score >= 50 ? 'text-orange-500' : 'text-red-600'
            return (
              <Link key={a.id} href={`/audits/${a.id}`} className="block">
                <div className="bg-card rounded-xl border border-border p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{a.audit_number}</span>
                      <Badge variant="secondary" className="text-[10px]">{AUDIT_V2_TYPE_CONFIG[a.audit_type]?.label}</Badge>
                      <Badge style={{ backgroundColor: sCfg.bg, color: sCfg.color }} className="text-[10px]">{sCfg.label}</Badge>
                      {vCfg && <Badge style={{ backgroundColor: vCfg.bg, color: vCfg.color }} className="text-[10px] font-bold">{vCfg.label}</Badge>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        <span className="text-green-600 font-semibold">{a.green_count}G</span>{' '}
                        <span className="text-yellow-500 font-semibold">{a.yellow_count}Y</span>{' '}
                        <span className="text-red-600 font-semibold">{a.red_count}R</span>{' '}
                        <span className="text-gray-400">{a.na_count}NA</span>
                      </div>
                      <span className={`text-lg font-bold font-mono ${scoreColor}`}>{a.overall_score}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {a.factories?.name} {a.factories?.city ? `· ${a.factories.city}` : ''} {a.factories?.country ? `, ${a.factories.country}` : ''} · {a.audit_date} · {a.auditor_name}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
