'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Download, ArrowUpRight, ArrowDownRight,
  BarChart3, ClipboardCheck, AlertTriangle, ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

export interface AnalyticsData {
  kpis: {
    total: number
    passCount: number
    failCount: number
    passRate: number
    avgScore: number
    totalCritical: number
    totalMajor: number
    totalMinor: number
    oqrPct: number
    fpAqlPct: number
  }
  monthlyTrend: { month: string; avgScore: number; passRate: number; inspections: number }[]
  factoryPassFail: { factory: string; pass: number; fail: number }[]
  defectDistribution: { name: string; value: number; color: string }[]
  projectStatusCounts: Record<string, number>
  factoryPerformance: { name: string; country: string | null; totalInspections: number; passRate: number; avgScore: number; defectRate: number }[]
  inspectorPerformance: { name: string; totalInspections: number; avgScore: number; passRate: number }[]
  exportRows: { project: string; factory: string; auditor: string; status: string; result: string; score: number | null; criticalDefects: number; majorDefects: number; minorDefects: number; date: string; remarks: string }[]
}

const TOOLTIP_STYLE = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
}

const PROJECT_STATUS_COLORS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Draft',      color: '#94a3b8' },
  active:    { label: 'Active',     color: '#3b82f6' },
  inspection:{ label: 'Inspection', color: '#f59e0b' },
  completed: { label: 'Completed',  color: '#22c55e' },
  cancelled: { label: 'Cancelled',  color: '#ef4444' },
}

function buildCSV(rows: AnalyticsData['exportRows']): string {
  const headers = ['Project', 'Factory', 'Auditor', 'Status', 'Result', 'Score', 'Critical Defects', 'Major Defects', 'Minor Defects', 'Date', 'Remarks']
  const escape = (v: string | number | null) => {
    if (v == null) return ''
    const s = String(v).replace(/"/g, '""')
    return `"${s}"`
  }
  const lines = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((r) => [
      escape(r.project), escape(r.factory), escape(r.auditor),
      escape(r.status), escape(r.result), escape(r.score),
      escape(r.criticalDefects), escape(r.majorDefects), escape(r.minorDefects),
      escape(r.date), escape(r.remarks),
    ].join(',')),
  ]
  return lines.join('\n')
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const { kpis, monthlyTrend, factoryPassFail, defectDistribution, projectStatusCounts, factoryPerformance, inspectorPerformance, exportRows } = data

  function handleExport() {
    if (exportRows.length === 0) { toast.info('No inspection data to export'); return }
    const csv = buildCSV(exportRows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inspection-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${exportRows.length} inspections`)
  }

  const totalDefects = kpis.totalCritical + kpis.totalMajor + kpis.totalMinor

  const projectStatusData = Object.entries(projectStatusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: PROJECT_STATUS_COLORS[status]?.label ?? status,
      value: count,
      color: PROJECT_STATUS_COLORS[status]?.color ?? '#94a3b8',
    }))

  // Cody's 4 Core KPIs (always visible at top)
  const codyKpis = [
    {
      label: 'Pass/Fail Rate',
      value: `${kpis.passRate}%`,
      icon: kpis.passRate >= 80 ? TrendingUp : TrendingDown,
      color: kpis.passRate >= 80 ? 'text-green-600' : 'text-red-500',
      bg: kpis.passRate >= 80 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
      sub: `${kpis.passCount} passed, ${kpis.failCount} failed`,
      trendUp: kpis.passRate >= 80,
    },
    {
      label: 'Defect Counts',
      value: totalDefects,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      sub: `${kpis.totalCritical}C ${kpis.totalMajor}Ma ${kpis.totalMinor}Mi`,
      trendUp: kpis.totalCritical === 0,
    },
    {
      label: 'OQR%',
      value: `${kpis.oqrPct}%`,
      icon: ShieldCheck,
      color: kpis.oqrPct >= 90 ? 'text-green-600' : 'text-purple-600',
      bg: kpis.oqrPct >= 90 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-purple-50 dark:bg-purple-900/20',
      sub: 'Outgoing Quality Rate',
      trendUp: kpis.oqrPct >= 90,
    },
    {
      label: 'FP AQL%',
      value: `${kpis.fpAqlPct}%`,
      icon: ClipboardCheck,
      color: kpis.fpAqlPct >= 80 ? 'text-blue-600' : 'text-amber-600',
      bg: kpis.fpAqlPct >= 80 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-amber-50 dark:bg-amber-900/20',
      sub: 'First-Pass AQL Rate',
      trendUp: kpis.fpAqlPct >= 80,
    },
  ]

  const kpiCards = codyKpis

  if (kpis.total === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Quality performance overview</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No analytics data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Complete some inspections to see your quality analytics here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quality performance overview</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleExport}
          disabled={exportRows.length === 0}
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* KPI Cards — with left-border accent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => {
          const Icon = k.icon
          const borderColor = k.color.replace('text-', '').replace('-600', '')
          const borderMap: Record<string, string> = { blue: '#3b82f6', green: '#22c55e', red: '#ef4444', purple: '#a855f7' }
          return (
            <Card key={k.label} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="pt-5 pb-4 relative">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r" style={{ background: borderMap[borderColor] ?? '#3b82f6' }} />
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', k.bg)}>
                    <Icon className={cn('w-4.5 h-4.5', k.color)} />
                  </div>
                  <div className={cn('flex items-center gap-0.5 text-[11px] font-medium', k.trendUp ? 'text-green-600' : 'text-red-500')}>
                    {k.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {k.sub}
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabbed Charts Section */}
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="factories">Factories</TabsTrigger>
          <TabsTrigger value="inspectors">Inspectors</TabsTrigger>
          <TabsTrigger value="defects">Defects</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Main chart — Score & Pass Rate Trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Score &amp; Pass Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Avg Score" />
                      <Line type="monotone" dataKey="passRate" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} name="Pass Rate %" strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Not enough data</div>
                )}
              </CardContent>
            </Card>

            {/* Right sidebar stats */}
            <div className="space-y-5">
              {/* Monthly Volume */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Monthly Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyTrend.length > 1 ? (
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="inspections" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Inspections" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">Need more data</div>
                  )}
                </CardContent>
              </Card>

              {/* Project Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Project Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {projectStatusData.length > 0 ? (
                    <div className="space-y-2">
                      {projectStatusData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-foreground">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[80px] flex items-center justify-center text-xs text-muted-foreground">No projects</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Factories Tab ── */}
        <TabsContent value="factories" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Pass / Fail Rate by Factory</CardTitle>
            </CardHeader>
            <CardContent>
              {factoryPassFail.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={factoryPassFail} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="factory" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="pass" stackId="a" fill="#22c55e" name="Pass %" />
                    <Bar dataKey="fail" stackId="a" fill="#ef4444" name="Fail %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">No factory data</div>
              )}
            </CardContent>
          </Card>

          {factoryPerformance.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Factory Performance Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-2.5">#</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-2.5">Factory</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2.5">Inspections</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2.5">Pass Rate</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-2.5">Avg Score</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-2.5">Defects/Insp.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {factoryPerformance.map((f, i) => (
                        <tr key={f.name} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3 text-xs font-bold text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-sm">{f.name}</div>
                            {f.country && <div className="text-[11px] text-muted-foreground">{f.country}</div>}
                          </td>
                          <td className="px-3 py-3 text-right text-sm">{f.totalInspections}</td>
                          <td className="px-3 py-3 text-right">
                            <span className={cn('text-sm font-semibold', f.passRate >= 85 ? 'text-green-600' : f.passRate >= 70 ? 'text-amber-600' : 'text-red-500')}>
                              {f.passRate}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-medium">{f.avgScore}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={cn('text-sm', f.defectRate <= 4 ? 'text-green-600' : f.defectRate <= 6 ? 'text-amber-600' : 'text-red-500')}>
                              {f.defectRate}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Inspectors Tab ── */}
        <TabsContent value="inspectors">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Inspector Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {inspectorPerformance.length > 0 ? (
                <div className="divide-y divide-border">
                  {inspectorPerformance.map((ip, i) => (
                    <div key={ip.name} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ip.name}</p>
                        <p className="text-[11px] text-muted-foreground">{ip.totalInspections} inspections</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={cn('text-sm font-bold', ip.avgScore >= 80 ? 'text-green-600' : 'text-red-500')}>
                          {ip.avgScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{ip.passRate}% pass</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground px-5">No inspector data yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Defects Tab ── */}
        <TabsContent value="defects">
          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Defect Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {totalDefects > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={defectDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                          {defectDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                      {defectDistribution.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-foreground">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No defects recorded</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Project Status</CardTitle>
              </CardHeader>
              <CardContent>
                {projectStatusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                          {projectStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                      {projectStatusData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-foreground">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No projects created</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
