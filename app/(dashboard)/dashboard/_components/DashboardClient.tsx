'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ShieldCheck, CircleCheck, Truck, FolderKanban, AlertTriangle, Factory as FactoryIcon,
  TrendingUp, ArrowUpRight, Plus,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { KpiCard, type KpiCardProps } from './KpiCard'

/* ─── TYPES ─── */

export interface TrendPoint {
  date: string
  passRate: number
  defectRate: number
  aqlScore: number
  reworkRate: number
}

export interface CategoryRow {
  label: string
  count: number
  percentage: number
  bg: string
  color: string
}

export interface RecentInspection {
  id: string
  inspectionNo: string
  factoryName: string | null
  category: string | null
  aqlLevel: string
  score: number | null
  result: string
  date: string
}

export interface DashboardData {
  firstName: string
  // Inline metrics
  inspectionsToday: number
  defectFreeRate: number
  pendingApprovals: number
  activeFactories: number
  criticalAlerts: number
  // KPI cards
  kpiCards: KpiCardProps[]
  // Category analysis
  categories: string[]
  categoryData: Record<string, CategoryRow[]>
  // Trend chart
  trendData: TrendPoint[]
  // Recent inspections
  recentInspections: RecentInspection[]
}

/* ─── CONSTANTS ─── */

const TOOLTIP_STYLE = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
}

const RESULT_BADGE: Record<string, { bg: string; color: string }> = {
  pass: { bg: '#E1F5EE', color: '#085041' },
  fail: { bg: '#FCEBEB', color: '#791F1F' },
  conditional_pass: { bg: '#FAEEDA', color: '#633806' },
  pending: { bg: '#FAEEDA', color: '#633806' },
}

/* ─── COMPONENT ─── */

export function DashboardClient({ data }: { data: DashboardData }) {
  const [activeCategory, setActiveCategory] = useState(data.categories[0] ?? 'All')
  const [trendRange, setTrendRange] = useState('30')

  const filteredTrend = useMemo(() => {
    const days = parseInt(trendRange)
    return data.trendData.slice(-days)
  }, [data.trendData, trendRange])

  const activeCategoryRows = data.categoryData[activeCategory] ?? []

  const metrics = [
    { label: 'Inspections today', value: data.inspectionsToday },
    { label: 'Defect-free rate', value: `${data.defectFreeRate}%` },
    { label: 'Pending approvals', value: data.pendingApprovals },
    { label: 'Active factories', value: data.activeFactories },
    { label: 'Critical alerts', value: data.criticalAlerts, danger: data.criticalAlerts > 0 },
  ]

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Welcome back, {data.firstName} &middot; Last updated just now
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Live
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8">Export</Button>
          <Button size="sm" className="text-xs h-8 gap-1" style={{ background: '#BA7517', color: '#fff', border: 'none' }} asChild>
            <Link href="/projects"><Plus size={14} /> New Project</Link>
          </Button>
        </div>
      </div>

      {/* ── INLINE METRICS BAR ── */}
      <div className="rounded-lg border border-border bg-card px-4 py-2.5 flex items-center gap-0 overflow-x-auto mb-4">
        {metrics.map((m, i) => (
          <div key={m.label} className="flex items-center">
            {i > 0 && <div className="w-px h-5 bg-border mx-4 shrink-0" />}
            <div className="shrink-0">
              <span className={cn('text-lg font-medium', m.danger ? 'text-[#E24B4A]' : 'text-foreground')}>{m.value}</span>
              <span className="text-[11px] text-muted-foreground ml-1.5">{m.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI CARDS ROW 1 ── */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {data.kpiCards.slice(0, 3).map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      {/* ── KPI CARDS ROW 2 ── */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {data.kpiCards.slice(3, 6).map((kpi, i) => (
          <KpiCard key={i} {...kpi} />
        ))}
      </div>

      {/* ── BOTTOM SECTION ── */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Left — Category Analysis */}
        <div className="rounded-[10px] border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Quality analysis by category</h3>
          {/* Tabs */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {data.categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
                  activeCategory === cat
                    ? 'text-white border-transparent'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
                style={activeCategory === cat ? { backgroundColor: '#BA7517' } : undefined}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Defect rows */}
          <div className="space-y-1.5">
            {activeCategoryRows.map(row => (
              <div
                key={row.label}
                className="flex items-center justify-between px-2.5 py-[7px] rounded-md"
                style={{ backgroundColor: row.bg, color: row.color }}
              >
                <span className="text-[11px] font-medium">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{row.count}</span>
                  <span className="text-[10px] opacity-70">{row.percentage}%</span>
                </div>
              </div>
            ))}
            {activeCategoryRows.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No data for this category</p>
            )}
          </div>
        </div>

        {/* Right — Quality Trend */}
        <div className="rounded-[10px] border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-foreground">Quality trend</h3>
              <p className="text-[10px] text-muted-foreground">Operational metrics over time</p>
            </div>
            <Select value={trendRange} onValueChange={setTrendRange}>
              <SelectTrigger className="h-7 w-auto text-[10px] rounded-full px-2.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7" className="text-xs">Last 7 days</SelectItem>
                <SelectItem value="30" className="text-xs">Last 30 days</SelectItem>
                <SelectItem value="90" className="text-xs">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={filteredTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="passRate" stroke="#1D9E75" strokeWidth={2} dot={false} name="Pass rate %" />
                <Line type="monotone" dataKey="defectRate" stroke="#E24B4A" strokeWidth={2} dot={false} name="Defect rate %" />
                <Line type="monotone" dataKey="aqlScore" stroke="#378ADD" strokeWidth={2} strokeDasharray="4 3" dot={false} name="AQL score %" />
                <Line type="monotone" dataKey="reworkRate" stroke="#EF9F27" strokeWidth={2} strokeDasharray="2 4" dot={false} name="Rework %" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-xs text-muted-foreground">No trend data available</div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {[
              { label: 'Pass rate', color: '#1D9E75', dash: false },
              { label: 'Defect rate', color: '#E24B4A', dash: false },
              { label: 'AQL score', color: '#378ADD', dash: true },
              { label: 'Rework %', color: '#EF9F27', dash: true },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                {l.dash ? (
                  <svg width="12" height="2"><line x1="0" y1="1" x2="12" y2="1" stroke={l.color} strokeWidth="2" strokeDasharray="3 2" /></svg>
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                )}
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RECENT INSPECTIONS TABLE ── */}
      <div className="rounded-[10px] border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Recent inspections</h3>
          <Link href="/inspections" className="text-[11px] font-medium" style={{ color: '#C9A96E' }}>
            View all <ArrowUpRight size={12} className="inline" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '14%' }}>Inspection</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '18%' }}>Factory</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '14%' }}>Category</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '8%' }}>AQL</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '10%' }}>Score</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '10%' }}>Result</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '12%' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInspections.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No inspections yet</td></tr>
              ) : (
                data.recentInspections.map((insp) => {
                  const badge = RESULT_BADGE[insp.result] ?? RESULT_BADGE.pending
                  return (
                    <tr key={insp.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground truncate">{insp.inspectionNo}</td>
                      <td className="px-4 py-2.5 text-muted-foreground truncate">{insp.factoryName ?? '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground truncate">{insp.category ?? '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{insp.aqlLevel}</td>
                      <td className="px-4 py-2.5 text-foreground font-medium">{insp.score != null ? `${insp.score}%` : '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {insp.result === 'conditional_pass' ? 'Review' : insp.result.charAt(0).toUpperCase() + insp.result.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{insp.date}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
