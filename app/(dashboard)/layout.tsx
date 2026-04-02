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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service role client for profile/org reads to bypass RLS
  // This is safe — we only read THIS user's profile (filtered by user.id)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const db = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : supabase

  const { data: profileData } = await (db.from('profiles') as any)
    .select('org_id, role, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  if (!profile || !profile.org_id) redirect('/onboarding')

  const { data: orgData } = await (db.from('organizations') as any)
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
