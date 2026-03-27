import { createClient } from '@/lib/supabase/server'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { UsersClient, type MemberRow } from './_components/UsersClient'

export default async function UsersPage() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url, invite_token, invite_accepted_at, invited_by, created_at')
    .eq('org_id', ctx.orgId)
    .order('created_at', { ascending: true })

  const profiles = ((data ?? []) as any[])

  // Resolve emails from auth.users — profiles don't store email, need the user's email
  // We'll use the profile id to look up auth users via the admin API if available
  // Fallback: use full_name-based display
  const allRows: MemberRow[] = profiles.map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string) || '',
    email: '', // populated below if possible
    role: p.role as MemberRow['role'],
    avatar_url: p.avatar_url as string | null,
    invite_token: p.invite_token as string | null,
    invite_accepted_at: p.invite_accepted_at as string | null,
    invited_by_name: null,
    created_at: p.created_at as string,
  }))

  // Try to get emails via admin client (requires SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()
    const { data: usersPage } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const emailMap = new Map<string, string>()
    usersPage?.users?.forEach((u: any) => emailMap.set(u.id, u.email ?? ''))
    allRows.forEach((r) => { r.email = emailMap.get(r.id) ?? '' })
  } catch {
    // Service role key not configured — emails won't show
  }

  const members = allRows.filter((r) => r.invite_token === null || r.invite_accepted_at !== null)
  const pendingInvites = allRows.filter((r) => r.invite_token !== null && r.invite_accepted_at === null)

  return (
    <UsersClient
      members={members}
      pendingInvites={pendingInvites}
      canManage={canManage(ctx.role)}
      currentUserId={ctx.userId}
    />
  )
}
