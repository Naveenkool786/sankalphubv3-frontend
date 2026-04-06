import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { CertificationsListClient } from './_components/CertificationsListClient'

export default async function CertificationsPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: certs }, { data: projects }] = await Promise.all([
    (supabase.from('product_certifications') as any).select('*, projects(name)').order('created_at', { ascending: false }),
    (supabase.from('projects') as any).select('id, name').order('name'),
  ])

  return (
    <div className="p-6 lg:p-8">
      <CertificationsListClient certs={(certs ?? []) as any[]} projects={(projects ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
