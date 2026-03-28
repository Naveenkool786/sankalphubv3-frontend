import { Building2 } from 'lucide-react'
import { getAllOrganizations } from '@/lib/console/queries'
import { OrganizationsClient } from './_components/OrganizationsClient'

export default async function OrganizationsPage() {
  const orgs = await getAllOrganizations()

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6" style={{ color: '#C9A96E' }} />
          Organizations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all organizations, plans, and trial status across the platform.
        </p>
      </div>
      <OrganizationsClient orgs={orgs} />
    </div>
  )
}
