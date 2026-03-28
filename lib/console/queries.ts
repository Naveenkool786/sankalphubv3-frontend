import { createAdminClient } from '@/lib/supabase/admin'

// Helper: cast admin queries to bypass strict Database types
// The typed schema doesn't include all runtime columns (e.g. trial_end, demo_requests table)
function from(table: string) {
  const admin = createAdminClient()
  return admin.from(table) as any
}

export async function getOverviewStats() {
  const [orgs, users, trials, demos, inspections, passedInspections] = await Promise.all([
    from('organizations').select('id', { count: 'exact', head: true }),
    from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    from('organizations').select('id', { count: 'exact', head: true })
      .eq('plan', 'trial').gt('trial_end', new Date().toISOString()),
    from('demo_requests').select('id', { count: 'exact', head: true }),
    from('inspections').select('id', { count: 'exact', head: true }),
    from('inspections').select('id', { count: 'exact', head: true }).eq('result', 'pass'),
  ])

  const totalInspections = inspections.count ?? 0
  const passRate = totalInspections > 0
    ? Math.round(((passedInspections.count ?? 0) / totalInspections) * 100)
    : 0

  return {
    totalOrgs: orgs.count ?? 0,
    totalUsers: users.count ?? 0,
    activeTrials: trials.count ?? 0,
    demoRequests: demos.count ?? 0,
    totalInspections,
    passRate,
  }
}

export async function getExpiringTrials(days: number) {
  const now = new Date()
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const { data } = await from('organizations')
    .select('id, name, slug, trial_end')
    .eq('plan', 'trial')
    .gt('trial_end', now.toISOString())
    .lte('trial_end', future.toISOString())
    .order('trial_end', { ascending: true })

  return (data ?? []) as { id: string; name: string; slug: string; trial_end: string }[]
}

export async function getRecentDemoRequests(limit: number) {
  const { data } = await from('demo_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as { id: string; full_name: string; company_name: string; role: string; created_at: string }[]
}

export async function getRecentSignups(limit: number) {
  const { data } = await from('profiles')
    .select('id, full_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as { id: string; full_name: string; role: string; created_at: string }[]
}

export async function getAllOrganizations() {
  const { data: orgs } = await from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: profiles } = await from('profiles')
    .select('org_id')
    .eq('is_active', true)

  const userCounts: Record<string, number> = {}
  for (const p of (profiles ?? []) as { org_id: string | null }[]) {
    if (p.org_id) {
      userCounts[p.org_id] = (userCounts[p.org_id] ?? 0) + 1
    }
  }

  return ((orgs ?? []) as any[]).map((org: any) => ({
    ...org,
    userCount: userCounts[org.id] ?? 0,
  }))
}

export async function getAllUsers() {
  const admin = createAdminClient()

  const [{ data: profiles }, { data: orgs }] = await Promise.all([
    from('profiles').select('*').order('created_at', { ascending: false }),
    from('organizations').select('id, name'),
  ])

  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })

  const emailMap: Record<string, string> = {}
  const lastLoginMap: Record<string, string | null> = {}
  for (const u of authUsers ?? []) {
    emailMap[u.id] = u.email ?? ''
    lastLoginMap[u.id] = u.last_sign_in_at ?? null
  }

  const orgMap: Record<string, string> = {}
  for (const o of (orgs ?? []) as { id: string; name: string }[]) {
    orgMap[o.id] = o.name
  }

  return ((profiles ?? []) as any[]).map((p: any) => ({
    ...p,
    email: emailMap[p.id] ?? '',
    lastLogin: lastLoginMap[p.id] ?? null,
    orgName: p.org_id ? (orgMap[p.org_id] ?? 'Unknown') : 'No Org',
  }))
}

export async function getAllDemoRequests() {
  const { data } = await from('demo_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as any[]
}

export async function getAnalyticsData() {
  const [
    totalOrgs,
    signupsThisMonth,
    signupsLastMonth,
    paidOrgs,
    inactiveOrgs,
    totalOrgsLastMonth,
  ] = await Promise.all([
    from('organizations').select('id', { count: 'exact', head: true }),
    from('profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    from('profiles').select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 60 * 86400000).toISOString())
      .lt('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    from('organizations').select('id', { count: 'exact', head: true })
      .in('plan', ['premium_single', 'premium_group', 'premium_enterprise', 'founding_member']),
    from('organizations').select('id', { count: 'exact', head: true })
      .eq('is_active', false),
    from('organizations').select('id', { count: 'exact', head: true })
      .lt('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
  ])

  return {
    totalOrgs: totalOrgs.count ?? 0,
    signupsThisMonth: signupsThisMonth.count ?? 0,
    signupsLastMonth: signupsLastMonth.count ?? 0,
    paidOrgs: paidOrgs.count ?? 0,
    inactiveOrgs: inactiveOrgs.count ?? 0,
    totalOrgsLastMonth: totalOrgsLastMonth.count ?? 0,
  }
}
