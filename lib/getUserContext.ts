import { createClient } from '@/lib/supabase/server'
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

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('org_id, role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const profile = profileData as { org_id: string | null; role: string; full_name: string; avatar_url: string | null } | null
  if (profileError || !profile) redirect('/login')
  if (!profile!.org_id) redirect('/onboarding')

  return {
    userId: user.id,
    orgId: profile!.org_id!,
    role: profile!.role as UserRole,
    fullName: profile!.full_name,
    email: user.email!,
    avatarUrl: profile!.avatar_url,
  }
}

export function canManage(role: UserRole): boolean {
  return ['super_admin', 'brand_manager'].includes(role)
}

export function canInspect(role: UserRole): boolean {
  return ['super_admin', 'brand_manager', 'factory_manager', 'inspector'].includes(role)
}
