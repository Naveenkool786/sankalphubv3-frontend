import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export type UserRole = 'super_admin' | 'brand_manager' | 'factory_manager' | 'inspector' | 'viewer'

export interface UserContext {
  userId: string
  orgId: string
  role: UserRole
  fullName: string
  email: string
  avatarUrl: string | null
}

export async function getUserContext(): Promise<UserContext> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Try service role client first (bypasses RLS)
  let profile: { org_id: string | null; role: string; full_name: string; avatar_url: string | null } | null = null

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
    )
    const { data } = await (admin.from('profiles') as any)
      .select('org_id, role, full_name, avatar_url')
      .eq('id', user.id)
      .single()
    if (data) profile = data
  }

  // Fallback to regular client
  if (!profile) {
    const { data } = await supabase
      .from('profiles')
      .select('org_id, role, full_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data as typeof profile
  }

  // If profile still missing, return defaults — do NOT redirect
  if (!profile || !profile.org_id) {
    return {
      userId: user.id,
      orgId: profile?.org_id ?? '',
      role: (profile?.role as UserRole) ?? 'viewer',
      fullName: profile?.full_name ?? user.email?.split('@')[0] ?? 'User',
      email: user.email!,
      avatarUrl: profile?.avatar_url ?? null,
    }
  }

  return {
    userId: user.id,
    orgId: profile.org_id,
    role: profile.role as UserRole,
    fullName: profile.full_name,
    email: user.email!,
    avatarUrl: profile.avatar_url,
  }
}

export function canManage(role: UserRole): boolean {
  return ['super_admin', 'brand_manager'].includes(role)
}

export function canInspect(role: UserRole): boolean {
  return ['super_admin', 'brand_manager', 'factory_manager', 'inspector'].includes(role)
}
