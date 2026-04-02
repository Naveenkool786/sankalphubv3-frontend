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
    const { data } = await (admin.from('profiles') as any)
      .select('org_id, role, full_name')
      .eq('id', userId)
      .single()

    if (data) return data as Profile
  }

  // Fallback to regular client
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('org_id, role, full_name')
    .eq('id', userId)
    .single()

  return data as Profile | null
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfileData(user.id)

  // If no profile at all, show dashboard with defaults — do NOT redirect
  const role = (profile?.role ?? 'viewer') as UserRole
  const orgId = profile?.org_id ?? ''
  const fullName = profile?.full_name || user.email?.split('@')[0] || 'User'

  // Get org name (only if we have an org_id)
  let orgName = 'My Organization'
  if (orgId) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
      const { data } = await (admin.from('organizations') as any)
        .select('name')
        .eq('id', orgId)
        .single()
      if (data) orgName = data.name
    } else {
      const { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single()
      if (data) orgName = (data as any).name
    }
  }

  return (
    <>
      <ImpersonationBanner />
      <AppShell
        role={role}
        orgName={orgName}
        fullName={fullName}
        email={user.email ?? ''}
      >
        {children}
      </AppShell>
    </>
  )
}
