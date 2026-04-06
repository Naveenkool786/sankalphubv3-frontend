import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { CostingListClient } from './_components/CostingListClient'

export default async function CostingPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: sheets } = await (supabase.from('cost_sheets') as any)
    .select('*, projects(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <CostingListClient sheets={(sheets ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
