import { createClient } from '@/lib/supabase/server'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { getOrgSeatStatus } from '@/lib/planGuard'
import { UsersClient, type MemberRow } from './_components/UsersClient'

export default async function UsersPage() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const [profilesResult, seatStatus] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url, invite_token, invite_accepted_at, invited_by, created_at')
      .eq('org_id', ctx.orgId)
      .order('created_at', { ascending: true }),
    getOrgSeatStatus(ctx.orgId),
  ])

  const profiles = ((profilesResult.data ?? []) as any[])

  const allRows: MemberRow[] = profiles.map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string) || '',
    email: '',
    role: p.role as MemberRow['role'],
    avatar_url: p.avatar_url as string | null,
    invite_token: p.invite_token as string | null,
    invite_accepted_at: p.invite_accepted_at as string | null,
    invited_by_name: null,
    created_at: p.created_at as string,
  }))

  // Resolve emails via admin client
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    const { data: usersPage } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const emailMap = new Map<string, string>()
    usersPage?.users?.forEach((u: any) => emailMap.set(u.id, u.email ?? ''))
    allRows.forEach((r) => { r.email = emailMap.get(r.id) ?? '' })
  } catch {
    // Service role key not configured
  }

  const members = allRows.filter((r) => r.invite_token === null || r.invite_accepted_at !== null)
  const pendingInvites = allRows.filter((r) => r.invite_token !== null && r.invite_accepted_at === null)

  return (
    <UsersClient
      members={members}
      pendingInvites={pendingInvites}
      canManage={canManage(ctx.role)}
      currentUserId={ctx.userId}
      seatStatus={seatStatus}
    />
  )
}
