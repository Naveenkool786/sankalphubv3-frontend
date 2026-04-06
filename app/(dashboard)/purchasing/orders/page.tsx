import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { POListClient } from './_components/POListClient'

export default async function PurchaseOrdersPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: orders } = await (supabase.from('purchase_orders') as any)
    .select('*, projects(name), factories(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <POListClient orders={(orders ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
