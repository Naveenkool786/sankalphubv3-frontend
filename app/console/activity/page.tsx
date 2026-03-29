import { Activity } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getConsoleContext } from '@/lib/console/getConsoleContext'
import { ActivityClient } from './_components/ActivityClient'

export default async function ActivityPage() {
  await getConsoleContext()
  const admin = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  // Stats
  const [eventsToday, activeUsersToday, deletionsToday, inspectionsToday] = await Promise.all([
    (admin.from('activity_log') as any).select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
    (admin.from('activity_log') as any).select('user_id', { count: 'exact', head: true }).gte('created_at', todayIso),
    (admin.from('activity_log') as any).select('id', { count: 'exact', head: true }).gte('created_at', todayIso).eq('action_type', 'delete'),
    (admin.from('activity_log') as any).select('id', { count: 'exact', head: true }).gte('created_at', todayIso).eq('category', 'inspections'),
  ])

  // Recent activity (first 50)
  const { data: recentActivity } = await (admin.from('activity_log') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // Build user/org maps
  const { data: profiles } = await (admin.from('profiles') as any).select('id, full_name, role')
  const { data: organizations } = await (admin.from('organizations') as any).select('id, name')

  const userMap: Record<string, { name: string; role: string }> = {}
  for (const p of (profiles ?? []) as any[]) {
    userMap[p.id] = { name: p.full_name || 'Unknown', role: p.role || 'viewer' }
  }
  const orgMap: Record<string, string> = {}
  for (const o of (organizations ?? []) as any[]) {
    orgMap[o.id] = o.name
  }

  // Enrich activity rows
  const enriched = ((recentActivity ?? []) as any[]).map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    userName: userMap[a.user_id]?.name ?? 'Unknown',
    userRole: userMap[a.user_id]?.role ?? 'viewer',
    orgName: a.organization_id ? (orgMap[a.organization_id] ?? 'Unknown') : 'N/A',
    actionType: a.action_type,
    category: a.category,
    actionLabel: a.action_label,
    detail: a.detail,
    createdAt: a.created_at,
  }))

  // Build filter lists
  const userList = ((profiles ?? []) as any[]).map((p: any) => ({ id: p.id, name: p.full_name || 'Unknown' }))
  const orgList = ((organizations ?? []) as any[]).map((o: any) => ({ id: o.id, name: o.name }))

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6" style={{ color: '#C9A96E' }} />
          User Activity
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every action taken across all users and organisations.
        </p>
      </div>
      <ActivityClient
        activity={enriched}
        stats={{
          eventsToday: eventsToday.count ?? 0,
          activeUsersToday: activeUsersToday.count ?? 0,
          deletionsToday: deletionsToday.count ?? 0,
          inspectionsToday: inspectionsToday.count ?? 0,
        }}
        users={userList}
        orgs={orgList}
      />
    </div>
  )
}
