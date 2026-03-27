import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/getUserContext'
import { AnalyticsClient } from './_components/AnalyticsClient'
import type { AnalyticsData } from './_components/AnalyticsClient'

export default async function AnalyticsPage() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const [{ data: rawInspections }, { data: rawProjects }] = await Promise.all([
    supabase
      .from('inspections')
      .select('id, result, score, critical_defects, major_defects, minor_defects, inspection_date, auditor_name, status, remarks, projects(name), factories(name, country)')
      .eq('org_id', ctx.orgId),
    supabase
      .from('projects')
      .select('id, status')
      .eq('org_id', ctx.orgId),
  ])

  const insp = ((rawInspections ?? []) as any[])
  const projs = ((rawProjects ?? []) as any[])

  // KPIs
  const total = insp.length
  const passCount = insp.filter((i) => i.result === 'pass').length
  const failCount = insp.filter((i) => i.result === 'fail').length
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0
  const scored = insp.filter((i) => i.score != null)
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s: number, i: any) => s + i.score, 0) / scored.length)
    : 0
  const totalCritical = insp.reduce((s: number, i: any) => s + (i.critical_defects ?? 0), 0)
  const totalMajor = insp.reduce((s: number, i: any) => s + (i.major_defects ?? 0), 0)
  const totalMinor = insp.reduce((s: number, i: any) => s + (i.minor_defects ?? 0), 0)

  // Monthly trend (group by YYYY-MM, sorted, last 6 months)
  const monthMap = new Map<string, { label: string; scores: number[]; passCount: number; total: number }>()
  insp.forEach((i: any) => {
    if (!i.inspection_date) return
    const d = new Date(i.inspection_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!monthMap.has(key)) monthMap.set(key, { label, scores: [], passCount: 0, total: 0 })
    const m = monthMap.get(key)!
    m.total++
    if (i.score != null) m.scores.push(i.score)
    if (i.result === 'pass') m.passCount++
  })
  const monthlyTrend = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, m]) => ({
      month: m.label,
      avgScore: m.scores.length > 0 ? Math.round(m.scores.reduce((a, b) => a + b) / m.scores.length) : 0,
      passRate: m.total > 0 ? Math.round((m.passCount / m.total) * 100) : 0,
      inspections: m.total,
    }))

  // Factory pass/fail stacked bar
  const fpfMap = new Map<string, { pass: number; total: number }>()
  insp.forEach((i: any) => {
    const fname = i.factories?.name ?? null
    if (!fname) return
    if (!fpfMap.has(fname)) fpfMap.set(fname, { pass: 0, total: 0 })
    const f = fpfMap.get(fname)!
    f.total++
    if (i.result === 'pass') f.pass++
  })
  const factoryPassFail = Array.from(fpfMap.entries())
    .slice(0, 6)
    .map(([factory, f]) => ({
      factory,
      pass: f.total > 0 ? Math.round((f.pass / f.total) * 100) : 0,
      fail: f.total > 0 ? Math.round(((f.total - f.pass) / f.total) * 100) : 0,
    }))

  // Defect distribution pie
  const defectDistribution = [
    { name: 'Critical', value: totalCritical, color: '#ef4444' },
    { name: 'Major', value: totalMajor, color: '#f59e0b' },
    { name: 'Minor', value: totalMinor, color: '#3b82f6' },
  ].filter((d) => d.value > 0)

  // Project status counts pie
  const projectStatusCounts: Record<string, number> = {}
  projs.forEach((p: any) => {
    projectStatusCounts[p.status] = (projectStatusCounts[p.status] ?? 0) + 1
  })

  // Factory performance leaderboard
  const fpMap = new Map<string, { country: string | null; scores: number[]; pass: number; total: number; defects: number }>()
  insp.forEach((i: any) => {
    const fname = i.factories?.name ?? null
    if (!fname) return
    if (!fpMap.has(fname)) fpMap.set(fname, { country: i.factories?.country ?? null, scores: [], pass: 0, total: 0, defects: 0 })
    const f = fpMap.get(fname)!
    f.total++
    if (i.score != null) f.scores.push(i.score)
    if (i.result === 'pass') f.pass++
    f.defects += (i.critical_defects ?? 0) + (i.major_defects ?? 0) + (i.minor_defects ?? 0)
  })
  const factoryPerformance = Array.from(fpMap.entries())
    .map(([name, f]) => ({
      name,
      country: f.country,
      totalInspections: f.total,
      passRate: f.total > 0 ? Math.round((f.pass / f.total) * 100) : 0,
      avgScore: f.scores.length > 0 ? Math.round(f.scores.reduce((a, b) => a + b) / f.scores.length) : 0,
      defectRate: f.total > 0 ? parseFloat((f.defects / f.total).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.passRate - a.passRate)

  // Inspector performance
  const ipMap = new Map<string, { scores: number[]; pass: number; total: number }>()
  insp.forEach((i: any) => {
    const name = i.auditor_name?.trim()
    if (!name) return
    if (!ipMap.has(name)) ipMap.set(name, { scores: [], pass: 0, total: 0 })
    const ip = ipMap.get(name)!
    ip.total++
    if (i.score != null) ip.scores.push(i.score)
    if (i.result === 'pass') ip.pass++
  })
  const inspectorPerformance = Array.from(ipMap.entries())
    .map(([name, ip]) => ({
      name,
      totalInspections: ip.total,
      avgScore: ip.scores.length > 0 ? Math.round(ip.scores.reduce((a, b) => a + b) / ip.scores.length) : 0,
      passRate: ip.total > 0 ? Math.round((ip.pass / ip.total) * 100) : 0,
    }))
    .sort((a, b) => b.totalInspections - a.totalInspections)

  // Export rows
  const exportRows = insp.map((i: any) => ({
    project: i.projects?.name ?? '',
    factory: i.factories?.name ?? '',
    auditor: i.auditor_name ?? '',
    status: i.status,
    result: i.result,
    score: i.score,
    criticalDefects: i.critical_defects ?? 0,
    majorDefects: i.major_defects ?? 0,
    minorDefects: i.minor_defects ?? 0,
    date: i.inspection_date,
    remarks: i.remarks ?? '',
  }))

  const data: AnalyticsData = {
    kpis: { total, passCount, failCount, passRate, avgScore, totalCritical, totalMajor, totalMinor },
    monthlyTrend,
    factoryPassFail,
    defectDistribution,
    projectStatusCounts,
    factoryPerformance,
    inspectorPerformance,
    exportRows,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <AnalyticsClient data={data} />
    </div>
  )
}
