import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { AppShell } from '@/components/layout/AppShell'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import type { UserRole } from '@/types/database'

interface Profile {
  org_id: string | null
  role: string
  full_name: string
}

async function getProfileData(userId: string) {
  // Try service role client first (bypasses RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
    )
    const { data, error } = await (admin.from('profiles') as any)
      .select('org_id, role, full_name')
      .eq('id', userId)
      .single()

    if (data) return data as Profile
    console.error('[DashboardLayout] Admin profile query failed:', error?.message)
  }

  // Fallback to regular client
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('org_id, role, full_name')
    .eq('id', userId)
    .single()

  if (error) console.error('[DashboardLayout] Profile query failed:', error.message)
  return data as Profile | null
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfileData(user.id)

  if (!profile || !profile.org_id) {
    console.error('[DashboardLayout] No profile or org_id for user:', user.id, 'profile:', profile)
    redirect('/onboarding')
  }

  // Get org name
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let orgName = 'My Organization'
  if (serviceKey) {
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    const { data } = await (admin.from('organizations') as any)
      .select('name')
      .eq('id', profile.org_id)
      .single()
    if (data) orgName = data.name
  } else {
    const { data } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.org_id)
      .single()
    if (data) orgName = (data as any).name
  }

  return (
    <>
      <ImpersonationBanner />
      <AppShell
        role={profile.role as UserRole}
        orgName={orgName}
        fullName={profile.full_name || user.email?.split('@')[0] || 'User'}
        email={user.email ?? ''}
      >
        {children}
      </AppShell>
    </>
  )
}
