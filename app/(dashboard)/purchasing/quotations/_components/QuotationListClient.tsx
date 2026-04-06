'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { QUOTATION_STATUS_CONFIG, type Quotation } from '@/lib/types/purchasing'
import { formatMoney } from '@/lib/types/costing'

interface Props { quotations: Quotation[]; canManage: boolean }

export function QuotationListClient({ quotations, canManage }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = quotations.filter(q => {
    const matchSearch = !search || [q.quotation_number, q.supplier_name, q.projects?.name].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || q.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: '#D4A843' }} /> Quotations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{quotations.length} quotations</p>
        </div>
        {canManage && (
          <Link href="/purchasing/quotations/new">
            <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }}>
              <Plus className="w-4 h-4" /> New Quotation
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search quotation, supplier..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {Object.entries(QUOTATION_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No quotations found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const cfg = QUOTATION_STATUS_CONFIG[q.status] || QUOTATION_STATUS_CONFIG.draft
            return (
              <Link key={q.id} href={`/purchasing/quotations/${q.id}`} className="block">
                <div className="bg-card rounded-xl border border-border p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{q.quotation_number}</span>
                      <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} className="text-[10px]">{cfg.label}</Badge>
                    </div>
                    <span className="text-sm font-mono font-semibold">{formatMoney(q.total_amount, q.currency)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.supplier_name} {q.projects?.name ? `· ${q.projects.name}` : ''} {q.valid_until ? `· Valid until ${q.valid_until}` : ''}
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
