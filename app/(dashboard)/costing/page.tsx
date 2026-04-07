import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { CostingListClient } from './_components/CostingListClient'

export default async function CostingPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  // Scope to org: get project IDs for this org, then filter cost sheets
  const { data: orgProjects } = await (supabase.from('projects') as any)
    .select('id').eq('org_id', ctx.orgId)
  const orgProjectIds = (orgProjects ?? []).map((p: any) => p.id)

  const { data: sheets } = orgProjectIds.length > 0
    ? await (supabase.from('cost_sheets') as any)
        .select('*, projects(name)')
        .in('project_id', orgProjectIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="p-6 lg:p-8">
      <CostingListClient sheets={(sheets ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
