import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/getUserContext'
import { DashboardClient, type DashboardData, type TrendPoint, type CategoryRow, type RecentInspection } from './_components/DashboardClient'
import { DashboardEmptyState } from './_components/DashboardEmptyState'
import { ShieldCheck, CircleCheck, Truck, FolderKanban, AlertTriangle, Factory as FactoryIcon } from 'lucide-react'
import { format, subDays, startOfMonth, subMonths } from 'date-fns'

export default async function DashboardPage() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const currentMonthStart = startOfMonth(now).toISOString()
  const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
  const ninetyDaysAgo = subDays(now, 90).toISOString()

  // ── PARALLEL DATA FETCHES ──
  const [
    { data: allInspections },
    { data: projects },
    { data: factories },
    { data: recentRaw },
    { count: templateCount },
    { count: teamCount },
    { data: auditedFactories },
  ] = await Promise.all([
    (supabase.from('inspections') as any)
      .select('id, result, status, score, critical_defects, major_defects, minor_defects, aql_level, inspection_date, created_at, project_id, factory_id')
      .eq('org_id', ctx.orgId),
    (supabase.from('projects') as any)
      .select('id, status, product_category')
      .eq('org_id', ctx.orgId),
    (supabase.from('factories') as any)
      .select('id, is_active')
      .eq('org_id', ctx.orgId),
    (supabase.from('inspections') as any)
      .select('id, inspection_no, result, status, score, aql_level, inspection_date, inspection_type, project_id, factory_id, projects(name, product_category), factories(name)')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(5),
    (supabase.from('inspection_templates') as any)
      .select('id', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    (supabase.from('profiles') as any)
      .select('id', { count: 'exact', head: true })
      .eq('org_id', ctx.orgId),
    (supabase.from('factories') as any)
      .select('id, name, latest_audit_score, latest_audit_result')
      .eq('org_id', ctx.orgId)
      .not('latest_audit_score', 'is', null)
      .order('latest_audit_score', { ascending: false })
      .limit(4),
  ])

  const inspections = (allInspections ?? []) as any[]
  const projs = (projects ?? []) as any[]
  const facts = (factories ?? []) as any[]

  // ── EMPTY STATE CHECK ──
  const hasData = projs.length > 0 || inspections.length > 0 || facts.length > 0

  if (!hasData) {
    const firstName = ctx.fullName?.split(' ')[0] || 'there'
    return (
      <div className="p-6 lg:p-8">
        <DashboardEmptyState
          firstName={firstName}
          factoryCount={facts.length}
          projectCount={projs.length}
          templateCount={templateCount ?? 0}
          inspectionCount={inspections.length}
          teamCount={teamCount ?? 0}
        />
      </div>
    )
  }

  // ── DATA AGGREGATION ──
  const firstName = ctx.fullName?.split(' ')[0] || 'there'

  // Project category map
  const projectCategoryMap: Record<string, string> = {}
  for (const p of projs) {
    if (p.id && p.product_category) projectCategoryMap[p.id] = p.product_category
  }

  // Current month vs previous month inspections
  const currentMonthInspections = inspections.filter((i: any) => i.created_at >= currentMonthStart)
  const prevMonthInspections = inspections.filter((i: any) => i.created_at >= prevMonthStart && i.created_at < currentMonthStart)

  // Counts
  const totalInspections = inspections.length
  const passedInspections = inspections.filter((i: any) => i.result === 'pass')
  const passRate = totalInspections > 0 ? Math.round((passedInspections.length / totalInspections) * 100 * 10) / 10 : 0

  const currentPassRate = currentMonthInspections.length > 0
    ? (currentMonthInspections.filter((i: any) => i.result === 'pass').length / currentMonthInspections.length) * 100
    : 0
  const prevPassRate = prevMonthInspections.length > 0
    ? (prevMonthInspections.filter((i: any) => i.result === 'pass').length / prevMonthInspections.length) * 100
    : 0
  const passRateDelta = prevPassRate > 0 ? currentPassRate - prevPassRate : 0

  // Defect-free rate
  const defectFreeCount = inspections.filter((i: any) => (i.critical_defects ?? 0) + (i.major_defects ?? 0) + (i.minor_defects ?? 0) === 0).length
  const defectFreeRate = totalInspections > 0 ? Math.round((defectFreeCount / totalInspections) * 100) : 0

  // Today's inspections
  const inspectionsToday = inspections.filter((i: any) => i.created_at >= todayStart).length

  // Pending approvals
  const pendingApprovals = inspections.filter((i: any) => i.status === 'report_pending' || i.status === 'submitted').length

  // Active factories
  const activeFactories = facts.filter((f: any) => f.is_active).length

  // Critical alerts
  const criticalAlerts = inspections.filter((i: any) => (i.critical_defects ?? 0) > 0 && i.status !== 'approved' && i.status !== 'cancelled').length

  // Open defects
  const openInspections = inspections.filter((i: any) => i.status !== 'approved' && i.status !== 'cancelled')
  const totalCritical = openInspections.reduce((s: number, i: any) => s + (i.critical_defects ?? 0), 0)
  const totalMajor = openInspections.reduce((s: number, i: any) => s + (i.major_defects ?? 0), 0)
  const totalMinor = openInspections.reduce((s: number, i: any) => s + (i.minor_defects ?? 0), 0)
  const openDefects = totalCritical + totalMajor + totalMinor

  // Projects breakdown
  const activeProjects = projs.filter((p: any) => p.status === 'active' || p.status === 'inspection').length
  const projectsInInspection = projs.filter((p: any) => p.status === 'inspection').length
  const projectsCompleted = projs.filter((p: any) => p.status === 'completed').length
  const projectsInProduction = projs.filter((p: any) => p.status === 'active').length

  // Completion rate as proxy for shipment rate
  const nonDraftProjects = projs.filter((p: any) => p.status !== 'draft' && p.status !== 'cancelled')
  const completionRate = nonDraftProjects.length > 0
    ? Math.round((projectsCompleted / nonDraftProjects.length) * 100 * 10) / 10
    : 0

  // AQL first pass yield (passed on first attempt — approximate as overall pass rate for now)
  const aqlYield = passRate

  // ── TREND DATA (last 90 days) ──
  const trendInspections = inspections.filter((i: any) => i.inspection_date >= ninetyDaysAgo)
  const dayMap: Record<string, { total: number; passed: number; defects: number; scores: number[]; rework: number }> = {}

  for (const insp of trendInspections) {
    const day = (insp.inspection_date ?? insp.created_at ?? '').slice(0, 10)
    if (!day) continue
    if (!dayMap[day]) dayMap[day] = { total: 0, passed: 0, defects: 0, scores: [], rework: 0 }
    dayMap[day].total++
    if (insp.result === 'pass') dayMap[day].passed++
    dayMap[day].defects += (insp.critical_defects ?? 0) + (insp.major_defects ?? 0) + (insp.minor_defects ?? 0)
    if (insp.score != null) dayMap[day].scores.push(insp.score)
  }

  const trendData: TrendPoint[] = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date: format(new Date(date), 'MMM d'),
      passRate: d.total > 0 ? Math.round((d.passed / d.total) * 100) : 0,
      defectRate: d.total > 0 ? Math.round((d.defects / d.total) * 100) : 0,
      aqlScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
      reworkRate: 0,
    }))

  // ── CATEGORY ANALYSIS ──
  const catMap: Record<string, { passExcellent: number; passGood: number; minor: number; major: number; critical: number; rework: number }> = {}

  for (const insp of inspections) {
    const cat = insp.project_id ? (projectCategoryMap[insp.project_id] ?? 'Uncategorised') : 'Uncategorised'
    if (!catMap[cat]) catMap[cat] = { passExcellent: 0, passGood: 0, minor: 0, major: 0, critical: 0, rework: 0 }
    const defects = (insp.critical_defects ?? 0) + (insp.major_defects ?? 0) + (insp.minor_defects ?? 0)
    if (insp.result === 'pass' && defects === 0) catMap[cat].passExcellent++
    else if (insp.result === 'pass') catMap[cat].passGood++
    if ((insp.minor_defects ?? 0) > 0) catMap[cat].minor += insp.minor_defects
    if ((insp.major_defects ?? 0) > 0) catMap[cat].major += insp.major_defects
    if ((insp.critical_defects ?? 0) > 0) catMap[cat].critical += insp.critical_defects
  }

  const categories = ['All', ...Object.keys(catMap).filter(c => c !== 'All').sort()]

  // Merge all into "All"
  const allCat = { passExcellent: 0, passGood: 0, minor: 0, major: 0, critical: 0, rework: 0 }
  for (const v of Object.values(catMap)) {
    allCat.passExcellent += v.passExcellent
    allCat.passGood += v.passGood
    allCat.minor += v.minor
    allCat.major += v.major
    allCat.critical += v.critical
    allCat.rework += v.rework
  }
  catMap['All'] = allCat

  function buildCategoryRows(data: typeof allCat): CategoryRow[] {
    const total = data.passExcellent + data.passGood + data.minor + data.major + data.critical + data.rework
    const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0
    return [
      { label: 'Pass — Excellent', count: data.passExcellent, percentage: pct(data.passExcellent), bg: '#E6F1FB', color: '#0C447C' },
      { label: 'Pass — Good', count: data.passGood, percentage: pct(data.passGood), bg: '#EEEDFE', color: '#3C3489' },
      { label: 'Minor defects', count: data.minor, percentage: pct(data.minor), bg: '#FAEEDA', color: '#633806' },
      { label: 'Major defects', count: data.major, percentage: pct(data.major), bg: '#EAF3DE', color: '#27500A' },
      { label: 'Critical defects', count: data.critical, percentage: pct(data.critical), bg: '#FCEBEB', color: '#791F1F' },
      { label: 'Rework required', count: data.rework, percentage: pct(data.rework), bg: '#E6F1FB', color: '#0C447C' },
    ]
  }

  const categoryData: Record<string, CategoryRow[]> = {}
  for (const [cat, data] of Object.entries(catMap)) {
    categoryData[cat] = buildCategoryRows(data)
  }

  // ── RECENT INSPECTIONS ──
  const recentInspections: RecentInspection[] = ((recentRaw ?? []) as any[]).map((i: any) => {
    const daysAgo = Math.floor((Date.now() - new Date(i.inspection_date || i.created_at).getTime()) / 86400000)
    return {
      id: i.id,
      inspectionNo: i.inspection_no ?? i.id.slice(0, 8),
      factoryName: i.factories?.name ?? null,
      category: i.projects?.product_category ?? null,
      aqlLevel: i.aql_level ?? '—',
      score: i.score,
      result: i.result ?? 'pending',
      date: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`,
    }
  })

  // ── BUILD KPI CARD PROPS ──
  const kpiCards = [
    {
      icon: ShieldCheck, iconBg: '#E1F5EE', iconColor: '#1D9E75',
      title: 'Overall Pass Rate', industryAvg: '82.0%',
      value: `${passRate}%`, delta: passRateDelta,
      progressPercent: passRate, progressColor: '#1D9E75',
      detailRows: [
        { label: 'Achieved target', value: `${passRate}%` },
        { label: 'Target progress', value: `${Math.min(Math.round(passRate / 0.82), 100)}%` },
      ],
      subMetrics: [
        { label: 'Garments', value: '—', dotColor: '#1D9E75' },
        { label: 'Footwear', value: '—', dotColor: '#378ADD' },
        { label: 'Gloves', value: '—', dotColor: '#EF9F27' },
      ],
    },
    {
      icon: CircleCheck, iconBg: '#E6F1FB', iconColor: '#185FA5',
      title: 'AQL First Pass Yield', industryAvg: '89.0%',
      value: `${aqlYield}%`, delta: passRateDelta * 0.8,
      progressPercent: aqlYield, progressColor: '#185FA5',
      detailRows: [
        { label: 'First-attempt pass', value: `${aqlYield}%` },
        { label: 'Target progress', value: `${Math.min(Math.round(aqlYield / 0.89), 100)}%` },
      ],
      subMetrics: [
        { label: 'Defect rate', value: `${100 - defectFreeRate}%`, dotColor: '#E24B4A' },
        { label: 'Rework', value: '0%', dotColor: '#EF9F27' },
        { label: 'Rejected', value: `${totalInspections > 0 ? Math.round((inspections.filter((i: any) => i.result === 'fail').length / totalInspections) * 100) : 0}%`, dotColor: '#791F1F' },
      ],
    },
    {
      icon: Truck, iconBg: '#FAEEDA', iconColor: '#854F0B',
      title: 'On-Time Shipment Rate', industryAvg: '84.0%',
      value: `${completionRate}%`, delta: 0,
      progressPercent: completionRate, progressColor: '#BA7517',
      detailRows: [
        { label: 'Completion rate', value: `${completionRate}%` },
        { label: 'Target progress', value: `${Math.min(Math.round(completionRate / 0.84), 100)}%` },
      ],
      subMetrics: [
        { label: 'NPS', value: '—', dotColor: '#1D9E75' },
        { label: 'Returns', value: '0%', dotColor: '#EF9F27' },
        { label: 'Claims', value: '0', dotColor: '#E24B4A' },
      ],
    },
    {
      icon: FolderKanban, iconBg: '#EEEDFE', iconColor: '#534AB7',
      title: 'Active Projects',
      value: `${activeProjects}`, delta: 0,
      progressPercent: projs.length > 0 ? Math.round((activeProjects / projs.length) * 100) : 0, progressColor: '#534AB7',
      detailRows: [
        { label: 'Active / Total', value: `${activeProjects} / ${projs.length}` },
        { label: 'Utilisation', value: `${projs.length > 0 ? Math.round((activeProjects / projs.length) * 100) : 0}%` },
      ],
      subMetrics: [
        { label: 'In inspection', value: projectsInInspection, dotColor: '#534AB7' },
        { label: 'In production', value: projectsInProduction, dotColor: '#378ADD' },
        { label: 'Completed', value: projectsCompleted, dotColor: '#1D9E75' },
      ],
    },
    {
      icon: AlertTriangle, iconBg: '#FCEBEB', iconColor: '#A32D2D',
      title: 'Open Defects',
      value: `${openDefects}`, delta: 0,
      progressPercent: totalInspections > 0 ? Math.min(Math.round((openDefects / totalInspections) * 100), 100) : 0, progressColor: '#E24B4A',
      detailRows: [
        { label: 'Open defects', value: `${openDefects}` },
        { label: 'Defect density', value: `${totalInspections > 0 ? (openDefects / totalInspections).toFixed(1) : 0} per inspection` },
      ],
      subMetrics: [
        { label: 'Critical', value: totalCritical, dotColor: '#E24B4A' },
        { label: 'Major', value: totalMajor, dotColor: '#EF9F27' },
        { label: 'Minor', value: totalMinor, dotColor: '#9CA3AF' },
      ],
    },
    {
      icon: FactoryIcon, iconBg: '#E1F5EE', iconColor: '#1D9E75',
      title: 'Active Factories',
      value: `${activeFactories}`, delta: 0,
      progressPercent: facts.length > 0 ? Math.round((activeFactories / facts.length) * 100) : 0, progressColor: '#1D9E75',
      detailRows: [
        { label: 'Active / Total', value: `${activeFactories} / ${facts.length}` },
        { label: 'Coverage', value: `${facts.length > 0 ? Math.round((activeFactories / facts.length) * 100) : 0}%` },
      ],
      subMetrics: [
        { label: 'Garments', value: '—', dotColor: '#1D9E75' },
        { label: 'Footwear', value: '—', dotColor: '#378ADD' },
        { label: 'Accessories', value: '—', dotColor: '#EF9F27' },
      ],
    },
  ]

  // ── RENDER ──
  const dashboardData: DashboardData = {
    firstName,
    inspectionsToday,
    defectFreeRate,
    pendingApprovals,
    activeFactories,
    criticalAlerts,
    kpiCards,
    categories,
    categoryData,
    trendData,
    recentInspections,
    factoryAuditScores: ((auditedFactories ?? []) as any[]).map((f: any) => ({
      id: f.id, name: f.name, score: f.latest_audit_score, result: f.latest_audit_result,
    })),
  }

  return (
    <div className="p-6 lg:p-8">
      <DashboardClient data={dashboardData} />
    </div>
  )
}
