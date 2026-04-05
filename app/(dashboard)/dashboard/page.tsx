import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserContext } from '@/lib/getUserContext'
import { DashboardClient, type DashboardData } from './_components/DashboardClient'

export default async function DashboardPage() {
  const ctx = await getUserContext()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const admin = serviceKey ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey) : null
  const supabase = admin ?? await createClient()

  // ── Parallel data fetches ──
  const [
    { count: projectCount },
    { data: inspectionStats },
    { count: factoryCount },
    { data: hasFactoryData },
    { data: hasProjectData },
    { data: hasTemplateData },
    { data: hasInspectionData },
    { data: membersData },
    { data: auditedFactories },
  ] = await Promise.all([
    (supabase.from('projects') as any).select('*', { count: 'exact', head: true }).eq('org_id', ctx.orgId).neq('status', 'draft'),
    (supabase.from('inspections') as any).select('aql_result').eq('org_id', ctx.orgId).eq('status', 'submitted'),
    (supabase.from('factories') as any).select('*', { count: 'exact', head: true }).eq('org_id', ctx.orgId).eq('is_active', true),
    (supabase.from('factories') as any).select('id').eq('org_id', ctx.orgId).limit(1),
    (supabase.from('projects') as any).select('id').eq('org_id', ctx.orgId).limit(1),
    (supabase.from('inspection_templates') as any).select('id').eq('org_id', ctx.orgId).limit(1),
    (supabase.from('inspections') as any).select('id').eq('org_id', ctx.orgId).eq('status', 'submitted').limit(1),
    (supabase.from('profiles') as any).select('id').eq('org_id', ctx.orgId).limit(5),
    (supabase.from('factories') as any).select('id, name, latest_audit_score, latest_audit_result').eq('org_id', ctx.orgId).not('latest_audit_score', 'is', null).order('latest_audit_score', { ascending: false }).limit(4),
  ])

  // Recent activity from notifications (may not exist)
  let recentActivity: any[] = []
  try {
    const { data, error } = await (supabase.from('notifications') as any)
      .select('title, detail, sound_category, link, created_at')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (!error && data) recentActivity = data
  } catch { /* table may not exist */ }

  // Inspection stats — current month
  const stats = (inspectionStats ?? []) as any[]
  const totalInspections = stats.length
  const passed = stats.filter((i: any) => i.aql_result === 'pass').length
  const passRate = totalInspections > 0 ? Math.round((passed / totalInspections) * 100) : null

  // Trend data: last month inspection count for comparison
  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const [{ count: thisMonthCount }, { count: lastMonthCount }] = await Promise.all([
    (supabase.from('inspections') as any).select('*', { count: 'exact', head: true }).eq('org_id', ctx.orgId).gte('created_at', startOfThisMonth),
    (supabase.from('inspections') as any).select('*', { count: 'exact', head: true }).eq('org_id', ctx.orgId).gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
  ])

  // Inspection trend: last 30 days by date
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  let inspectionTrend: { date: string; pass: number; fail: number }[] = []
  try {
    const { data: trendData } = await (supabase.from('inspections') as any)
      .select('created_at, aql_result')
      .eq('org_id', ctx.orgId)
      .gte('created_at', thirtyDaysAgo)
    if (trendData) {
      const byDate: Record<string, { pass: number; fail: number }> = {}
      for (const row of trendData as any[]) {
        const d = new Date(row.created_at).toISOString().slice(0, 10)
        if (!byDate[d]) byDate[d] = { pass: 0, fail: 0 }
        if (row.aql_result === 'pass') byDate[d].pass++
        else byDate[d].fail++
      }
      inspectionTrend = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }))
    }
  } catch { /* table may not exist */ }

  // Defect distribution by category
  let defectsByCategory: { category: string; count: number }[] = []
  try {
    const { data: defectData } = await (supabase.from('defect_records') as any)
      .select('category')
      .eq('org_id', ctx.orgId)
    if (defectData) {
      const counts: Record<string, number> = {}
      for (const d of defectData as any[]) {
        const cat = d.category || 'Other'
        counts[cat] = (counts[cat] || 0) + 1
      }
      defectsByCategory = Object.entries(counts).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count)
    }
  } catch { /* table may not exist */ }

  // Step completion
  const hasFactory = (hasFactoryData?.length || 0) > 0
  const hasProject = (hasProjectData?.length || 0) > 0
  const hasTemplate = (hasTemplateData?.length || 0) > 0
  const hasInspection = (hasInspectionData?.length || 0) > 0
  const hasTeamMember = (membersData?.length || 0) > 1

  let doneCount = 1 // account creation always done
  if (hasFactory) doneCount++
  if (hasFactory && hasProject) doneCount++
  if (hasFactory && hasProject && hasTemplate) doneCount++
  if (hasFactory && hasProject && hasTemplate && hasInspection) doneCount++
  if (hasFactory && hasProject && hasTemplate && hasInspection && hasTeamMember) doneCount++

  const dashboardData: DashboardData = {
    firstName: ctx.fullName?.split(' ')[0] || 'there',
    role: ctx.role,
    projectCount: projectCount ?? 0,
    inspectionCount: totalInspections,
    factoryCount: factoryCount ?? 0,
    passRate,
    passed,
    totalInspections,
    inspectionTrend: thisMonthCount ?? 0,
    lastMonthInspections: lastMonthCount ?? 0,
    doneCount,
    hasFactory,
    hasProject,
    hasTemplate,
    hasInspection,
    hasTeamMember,
    recentActivity: recentActivity.map((a: any) => ({
      title: a.title || '', detail: a.detail || '',
      category: a.sound_category || 'system',
      link: a.link || null,
      createdAt: a.created_at || '',
    })),
    factoryAuditScores: ((auditedFactories ?? []) as any[]).map((f: any) => ({
      id: f.id, name: f.name, score: f.latest_audit_score, result: f.latest_audit_result,
    })),
    inspectionTrendChart: inspectionTrend,
    defectsByCategory,
  }

  return (
    <div className="p-6 lg:p-8">
      <DashboardClient data={dashboardData} />
    </div>
  )
}
