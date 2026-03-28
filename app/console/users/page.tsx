import { Users } from 'lucide-react'
import { getAllUsers } from '@/lib/console/queries'
import { createAdminClient } from '@/lib/supabase/admin'
import { ConsoleUsersClient } from './_components/ConsoleUsersClient'

export default async function ConsoleUsersPage() {
  const users = await getAllUsers()

  const admin = createAdminClient()
  const { data: orgs } = await admin.from('organizations').select('id, name').order('name')

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6" style={{ color: '#C9A96E' }} />
          Users
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage all users across every organization on the platform.
        </p>
      </div>
      <ConsoleUsersClient users={users} orgs={orgs ?? []} />
    </div>
  )
}
