'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, FlaskConical, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TEST_CATEGORY_CONFIG, TEST_STATUS_CONFIG, type TestRequest } from '@/lib/types/testing'

interface Props { requests: TestRequest[]; labs: { id: string; lab_name: string }[]; canManage: boolean }

const RESULT_ICONS: Record<string, any> = {
  pass: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  fail: <XCircle className="w-4 h-4 text-red-600" />,
  conditional_pass: <AlertTriangle className="w-4 h-4 text-orange-500" />,
}

export function TestingListClient({ requests, labs, canManage }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let list = requests
    if (catFilter !== 'all') list = list.filter(r => r.test_category === catFilter)
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => r.request_number.toLowerCase().includes(q) || (r.fabric_type ?? '').toLowerCase().includes(q))
    }
    return list
  }, [requests, catFilter, statusFilter, search])

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="w-6 h-6" style={{ color: '#D4A843' }} /> Testing & Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{requests.length} test requests</p>
        </div>
        <div className="flex gap-2">
          <Link href="/testing/labs"><Button variant="outline" size="sm">Labs</Button></Link>
          {canManage && (
            <Link href="/testing/new">
              <Button className="gap-1.5" size="sm" style={{ backgroundColor: '#D4A843' }}><Plus className="w-4 h-4" /> New Test</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All categories</option>
          {Object.entries(TEST_CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(TEST_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FlaskConical className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No test requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const catCfg = TEST_CATEGORY_CONFIG[req.test_category] || TEST_CATEGORY_CONFIG.physical
            const statusCfg = TEST_STATUS_CONFIG[req.status] || TEST_STATUS_CONFIG.draft
            return (
              <div key={req.id} onClick={() => router.push(`/testing/${req.id}`)}
                className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-[#D4A843]/40 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{req.request_number}</span>
                    <Badge style={{ backgroundColor: catCfg.bg, color: catCfg.color }} className="text-[10px]">{catCfg.label}</Badge>
                    <Badge style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }} className="text-[10px]">{statusCfg.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {[req.fabric_type, req.lab_partners?.lab_name, req.buyer_standard].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {req.overall_result ? RESULT_ICONS[req.overall_result] || <Clock className="w-4 h-4 text-muted-foreground" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
