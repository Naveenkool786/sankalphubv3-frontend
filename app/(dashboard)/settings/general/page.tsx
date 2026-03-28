import { createClient } from '@/lib/supabase/server'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { SettingsClient, type ProfileData, type OrgData } from '../_components/SettingsClient'

export default async function GeneralSettingsPage() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const [{ data: profileData }, { data: orgData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, department, phone, avatar_url')
      .eq('id', ctx.userId)
      .single(),
    supabase
      .from('organizations')
      .select('id, name, org_type')
      .eq('id', ctx.orgId)
      .single(),
  ])

  const p = profileData as any
  const o = orgData as any

  const profile: ProfileData = {
    id: ctx.userId,
    full_name: p?.full_name ?? '',
    email: ctx.email,
    role: ctx.role,
    department: p?.department ?? null,
    phone: p?.phone ?? null,
  }

  const org: OrgData | null = o ? {
    id: o.id as string,
    name: o.name as string,
    org_type: o.org_type as string,
  } : null

  return (
    <SettingsClient
      profile={profile}
      org={org}
      canManage={canManage(ctx.role)}
    />
  )
}
