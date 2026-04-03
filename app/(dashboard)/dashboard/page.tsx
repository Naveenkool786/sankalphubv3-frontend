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
      .select('title, detail, sound_category, created_at')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (!error && data) recentActivity = data
  } catch { /* table may not exist */ }

  // Inspection stats
  const stats = (inspectionStats ?? []) as any[]
  const totalInspections = stats.length
  const passed = stats.filter((i: any) => i.aql_result === 'pass').length
  const passRate = totalInspections > 0 ? Math.round((passed / totalInspections) * 100) : null

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
    doneCount,
    hasFactory,
    hasProject,
    hasTemplate,
    hasInspection,
    hasTeamMember,
    recentActivity: recentActivity.map((a: any) => ({
      title: a.title || '', detail: a.detail || '',
      category: a.sound_category || 'system',
      createdAt: a.created_at || '',
    })),
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
