'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calculator, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { COST_STATUS_CONFIG, formatMoney, type CostSheet } from '@/lib/types/costing'

interface Props { sheets: CostSheet[]; canManage: boolean }

export function CostingListClient({ sheets, canManage }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = sheets.filter(s => {
    const matchSearch = !search || [s.style_number, s.style_name, s.projects?.name].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const selCls = 'h-9 px-3 rounded-lg border border-border bg-background text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5" style={{ color: '#D4A843' }} /> Costing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{sheets.length} cost sheets</p>
        </div>
        {canManage && (
          <Link href="/costing/new">
            <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }}>
              <Plus className="w-4 h-4" /> New Cost Sheet
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search style, project..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={selCls} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {Object.entries(COST_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Calculator className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No cost sheets found</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Style</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">V</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total Cost</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Target FOB</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Actual FOB</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(s => {
                  const cfg = COST_STATUS_CONFIG[s.status] || COST_STATUS_CONFIG.draft
                  const marginColor = s.margin_percentage != null ? (s.margin_percentage >= 20 ? 'text-green-600' : s.margin_percentage >= 10 ? 'text-yellow-600' : 'text-red-600') : ''
                  return (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5">
                        <Link href={`/costing/${s.id}`} className="hover:underline font-medium text-foreground">
                          {s.style_number || s.style_name || 'Untitled'}
                        </Link>
                        {s.style_name && s.style_number && <p className="text-muted-foreground text-[10px]">{s.style_name}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.projects?.name || '—'}</td>
                      <td className="px-3 py-2.5 text-center text-muted-foreground">v{s.version}</td>
                      <td className="px-3 py-2.5">
                        <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} className="text-[10px]">{cfg.label}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{formatMoney(s.total_cost, s.currency)}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{s.target_fob ? formatMoney(s.target_fob, s.currency) : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{s.actual_fob ? formatMoney(s.actual_fob, s.currency) : '—'}</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-semibold ${marginColor}`}>
                        {s.margin_percentage != null ? `${s.margin_percentage}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
