import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/getUserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FolderKanban,
  ClipboardCheck,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ProjectStatus, InspectionStatus, InspectionResult } from '@/types/database'

type ProjectRow = { status: ProjectStatus }
type InspectionRow = { result: InspectionResult; status: InspectionStatus; score: number | null }
type RecentRow = {
  id: string
  status: InspectionStatus
  result: InspectionResult
  score: number | null
  submitted_at: string | null
  inspection_date: string
  auditor_name: string | null
  projects: { name: string } | null
  factories: { name: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:          { label: 'Draft',          cls: 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-300' },
  scheduled:      { label: 'Scheduled',      cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  confirmed:      { label: 'Confirmed',      cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  in_progress:    { label: 'In Progress',    cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  report_pending: { label: 'Pending Review', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  submitted:      { label: 'Submitted',      cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  approved:       { label: 'Approved',       cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  cancelled:      { label: 'Cancelled',      cls: 'bg-red-500/15 text-red-500 dark:text-red-400' },
}

export default async function DashboardPage() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const [projectsRes, inspectionsRes, recentRes] = await Promise.all([
    supabase
      .from('projects')
      .select('status')
      .eq('org_id', ctx.orgId),
    supabase
      .from('inspections')
      .select('result, status, score')
      .eq('org_id', ctx.orgId),
    supabase
      .from('inspections')
      .select('id, status, result, score, submitted_at, inspection_date, auditor_name, projects(name), factories(name)')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Project stats
  const projects = (projectsRes.data ?? []) as ProjectRow[]
  const activeProjects = projects.filter(
    (p) => p.status === 'active' || p.status === 'inspection'
  ).length
  const totalProjects = projects.length

  // Inspection stats
  const inspections = (inspectionsRes.data ?? []) as InspectionRow[]
  const total = inspections.length
  const passed = inspections.filter((i) => i.result === 'pass').length
  const failed = inspections.filter((i) => i.result === 'fail').length
  const pending = inspections.filter(
    (i) => i.status === 'report_pending' || i.status === 'submitted'
  ).length
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
  const scores = inspections
    .filter((i) => i.score !== null)
    .map((i) => i.score as number)
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

  const recent = (recentRes.data ?? []) as RecentRow[]

  const kpis = [
    {
      title: 'Active Projects',
      value: activeProjects,
      icon: FolderKanban,
      trend: `${totalProjects} total`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Pending Reviews',
      value: pending,
      icon: Clock,
      trend: 'awaiting action',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Pass Rate',
      value: `${passRate}%`,
      icon: TrendingUp,
      trend: `${total} inspections`,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Avg. Score',
      value: avgScore > 0 ? avgScore : '—',
      icon: ClipboardCheck,
      trend: 'all time',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back — here is your quality overview.
          </p>
        </div>
        <Link href="/projects">
          <Button size="sm" className="gap-2 hidden sm:flex">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      k.bg
                    )}
                  >
                    <Icon size={18} className={k.color} />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {k.trend}
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{k.title}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Inspection Summary — only shown if there is data */}
      {total > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Inspection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted/40 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{total}</div>
                <div className="text-xs text-muted-foreground">Total Inspections</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{passed}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-500">{failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{pending}</div>
                <div className="text-xs text-muted-foreground">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Inspections */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Recent Inspections</CardTitle>
          <Link href="/inspections">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No inspections yet. Start one from the{' '}
              <Link href="/inspections" className="text-primary hover:underline">
                Inspections
              </Link>{' '}
              page.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((insp) => {
                const sc = STATUS_CONFIG[insp.status]
                const proj = insp.projects
                const fact = insp.factories
                return (
                  <div
                    key={insp.id}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {insp.result === 'pass' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : insp.result === 'fail' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {proj?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fact?.name ?? '—'} · {insp.auditor_name ?? '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-foreground">
                        {insp.score ?? '—'}
                      </div>
                      {sc && (
                        <Badge
                          className={cn(
                            'text-[10px] px-1.5 py-0 capitalize border-0',
                            sc.cls
                          )}
                        >
                          {sc.label}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block w-24 text-right">
                      {insp.submitted_at
                        ? new Date(insp.submitted_at).toLocaleDateString()
                        : insp.inspection_date
                          ? new Date(insp.inspection_date).toLocaleDateString()
                          : 'In progress'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
