'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Palette, Plus, Search, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LIFECYCLE_CONFIG, type Style, type LifecycleStage } from '@/lib/types/merchandising'

interface Props { styles: Style[]; canManage: boolean }

export function StyleListClient({ styles, canManage }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = styles.filter(s => {
    const matchSearch = !search || [s.style_number, s.style_name, s.buyer_brand].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter
    const matchLC = lifecycleFilter === 'all' || s.lifecycle_stage === lifecycleFilter
    return matchSearch && matchCat && matchLC
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5" style={{ color: '#D4A843' }} /> Style Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{styles.length} styles</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={cn('px-2 py-1.5', viewMode === 'grid' ? 'bg-muted' : '')}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={cn('px-2 py-1.5', viewMode === 'list' ? 'bg-muted' : '')}><List className="w-4 h-4" /></button>
          </div>
          {canManage && (
            <Link href="/merchandising/styles/new">
              <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }}><Plus className="w-4 h-4" /> New Style</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search style #, name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {['woven', 'knits', 'denim', 'outerwear', 'accessories'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select className="h-9 px-3 rounded-lg border border-border bg-background text-sm" value={lifecycleFilter} onChange={e => setLifecycleFilter(e.target.value)}>
          <option value="all">All Stages</option>
          {Object.entries(LIFECYCLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><p className="text-sm text-muted-foreground">No styles found</p></div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(s => {
            const lc = LIFECYCLE_CONFIG[s.lifecycle_stage]
            return (
              <Link key={s.id} href={`/merchandising/styles/${s.id}`} className="block">
                <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 bg-muted/30 flex items-center justify-center">
                    <Palette className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-mono font-semibold">{s.style_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.style_name}</p>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {s.category && <Badge variant="secondary" className="text-[9px] capitalize">{s.category}</Badge>}
                      {lc && <Badge style={{ backgroundColor: lc.bg, color: lc.color }} className="text-[9px]">{lc.label}</Badge>}
                    </div>
                    {s.target_fob && <p className="text-xs font-mono mt-1">${Number(s.target_fob).toFixed(2)} FOB</p>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Style #</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Season</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Stage</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">FOB</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Factory</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map(s => {
                  const lc = LIFECYCLE_CONFIG[s.lifecycle_stage]
                  return (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2"><Link href={`/merchandising/styles/${s.id}`} className="font-mono font-semibold hover:underline">{s.style_number}</Link></td>
                      <td className="px-3 py-2">{s.style_name}</td>
                      <td className="px-3 py-2 capitalize text-muted-foreground">{s.category || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{s.seasons?.season_code || '—'}</td>
                      <td className="px-3 py-2">{lc && <Badge style={{ backgroundColor: lc.bg, color: lc.color }} className="text-[10px]">{lc.label}</Badge>}</td>
                      <td className="px-3 py-2 text-right font-mono">{s.target_fob ? `$${Number(s.target_fob).toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{s.factories?.name || '—'}</td>
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
