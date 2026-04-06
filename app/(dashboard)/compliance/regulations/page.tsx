'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { REGION_CONFIG, CATEGORY_CONFIG, type ComplianceRequirement, type ComplianceRegion, type ComplianceCategory } from '@/lib/types/compliance'
import { seedRegulations } from '@/lib/actions/compliance'

export default function RegulationsPage() {
  const [regs, setRegs] = useState<ComplianceRequirement[]>([])
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [catFilter, setCatFilter] = useState<string>('all')

  useEffect(() => {
    (async () => {
      await seedRegulations()
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await (supabase.from('compliance_requirements') as any).select('*').eq('is_active', true).order('region').order('regulation_name')
      if (data) setRegs(data)
    })()
  }, [])

  const filtered = regs.filter(r => {
    const matchRegion = regionFilter === 'all' || r.region === regionFilter
    const matchCat = catFilter === 'all' || r.category === catFilter
    return matchRegion && matchCat
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="w-5 h-5" style={{ color: '#D4A843' }} /> Regulations Registry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{regs.length} regulations tracked</p>
      </div>

      <div className="flex gap-3 mb-4">
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
          <option value="all">All Regions</option>
          {Object.entries(REGION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.label}</option>)}
        </select>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Regulation</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Code</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Region</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Testing</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Cert</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => {
                const region = r.region ? REGION_CONFIG[r.region as ComplianceRegion] : null
                const cat = r.category ? CATEGORY_CONFIG[r.category as ComplianceCategory] : null
                return (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <span className="font-medium text-foreground">{r.regulation_name}</span>
                      {r.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>}
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{r.regulation_code || '—'}</td>
                    <td className="px-3 py-2">{region ? <span>{region.flag} {region.label}</span> : '—'}</td>
                    <td className="px-3 py-2">{cat ? <Badge style={{ backgroundColor: cat.color + '20', color: cat.color }} className="text-[10px]">{cat.label}</Badge> : '—'}</td>
                    <td className="px-3 py-2 text-center">{r.testing_required ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                    <td className="px-3 py-2 text-center">{r.certification_required ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
