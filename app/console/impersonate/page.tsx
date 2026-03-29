import { UserCog } from 'lucide-react'
import { getAllUsers } from '@/lib/console/queries'
import { createAdminClient } from '@/lib/supabase/admin'
import { ImpersonateClient } from './_components/ImpersonateClient'

export default async function ImpersonatePage() {
  const users = await getAllUsers()

  const admin = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: sessionsToday } = await (admin.from('impersonation_sessions') as any)
    .select('id', { count: 'exact', head: true })
    .gte('started_at', today.toISOString())

  const { count: totalOrgs } = await (admin.from('organizations') as any)
    .select('id', { count: 'exact', head: true })

  const { data: orgs } = await (admin.from('organizations') as any)
    .select('id, name')
    .order('name')

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCog className="w-6 h-6" style={{ color: '#C9A96E' }} />
          User Impersonation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View the platform as any user. Sessions are logged.
        </p>
      </div>
      <ImpersonateClient
        users={users}
        orgs={orgs ?? []}
        totalOrgs={totalOrgs ?? 0}
        totalUsers={users.length}
        sessionsToday={sessionsToday ?? 0}
      />
    </div>
  )
}
