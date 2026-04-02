import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import type { UserRole } from '@/types/database'

interface Profile {
  org_id: string | null
  role: string
  full_name: string
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('org_id, role, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  if (!profile || !profile.org_id) redirect('/onboarding')

  const { data: orgData } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.org_id)
    .single()

  const org = orgData as { name: string } | null

  return (
    <>
      <ImpersonationBanner />
      <AppShell
        role={profile.role as UserRole}
        orgName={org?.name ?? 'My Organization'}
        fullName={profile.full_name || user.email?.split('@')[0] || 'User'}
        email={user.email ?? ''}
      >
        {children}
      </AppShell>
    </>
  )
}
