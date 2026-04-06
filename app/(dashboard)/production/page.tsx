import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { ProductionListClient } from './_components/ProductionListClient'

export default async function ProductionPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: orders }, { data: factories }] = await Promise.all([
    (supabase.from('production_orders') as any)
      .select('*, factories(name), projects(name)')
      .order('created_at', { ascending: false }),
    (supabase.from('factories') as any)
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div className="p-6 lg:p-8">
      <ProductionListClient
        orders={(orders ?? []) as any[]}
        factories={(factories ?? []) as any[]}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
