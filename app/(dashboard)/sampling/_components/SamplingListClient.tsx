'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SAMPLE_TYPE_CONFIG, SAMPLE_STATUS_CONFIG, STAGE_ORDER, type SampleRequest, type SampleType } from '@/lib/types/sampling'

interface Props {
  samples: SampleRequest[]
  factories: { id: string; name: string }[]
  canManage: boolean
}

export function SamplingListClient({ samples, factories, canManage }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = samples
    if (typeFilter !== 'all') list = list.filter(s => s.sample_type === typeFilter)
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.request_number.toLowerCase().includes(q) ||
        (s.style_number ?? '').toLowerCase().includes(q) ||
        (s.style_name ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [samples, typeFilter, statusFilter, search])

  const pendingReview = samples.filter(s => s.status === 'submitted' || s.status === 'under_review').length

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Scissors className="w-6 h-6" style={{ color: '#D4A843' }} />
            Sampling
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {samples.length} samples{pendingReview > 0 && <span className="text-amber-600 ml-1">· {pendingReview} pending review</span>}
          </p>
        </div>
        {canManage && (
          <Link href="/sampling/new">
            <Button className="gap-1.5" style={{ backgroundColor: '#D4A843' }}>
              <Plus className="w-4 h-4" /> New Sample Request
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search by request #, style..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          {STAGE_ORDER.map(t => <option key={t} value={t}>{SAMPLE_TYPE_CONFIG[t].label}</option>)}
        </select>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(SAMPLE_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Scissors className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No sample requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sample => {
            const typeCfg = SAMPLE_TYPE_CONFIG[sample.sample_type] || SAMPLE_TYPE_CONFIG.proto
            const statusCfg = SAMPLE_STATUS_CONFIG[sample.status] || SAMPLE_STATUS_CONFIG.requested
            const stageIndex = STAGE_ORDER.indexOf(sample.sample_type)

            return (
              <div key={sample.id} onClick={() => router.push(`/sampling/${sample.id}`)}
                className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-[#D4A843]/40 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{sample.request_number}</span>
                    <Badge style={{ backgroundColor: typeCfg.bg, color: typeCfg.color }} className="text-[10px]">{typeCfg.label}</Badge>
                    <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }} className="text-[10px]">{statusCfg.label}</Badge>
                    {sample.revision_number > 1 && <Badge variant="secondary" className="text-[10px]">Rev {sample.revision_number}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {[sample.style_name, sample.factories?.name, sample.buyer_brand].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {/* Stage dots */}
                <div className="flex gap-1 flex-shrink-0">
                  {STAGE_ORDER.map((stage, i) => (
                    <div key={stage} className="w-2 h-2 rounded-full" style={{
                      backgroundColor: i < stageIndex ? '#2E7D32' : i === stageIndex ? '#D4A843' : 'var(--border)',
                    }} />
                  ))}
                </div>
                {sample.required_date && (
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">
                    Due: {new Date(sample.required_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
