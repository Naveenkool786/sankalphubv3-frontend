import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { ProductionDetailClient } from './_components/ProductionDetailClient'

export default async function ProductionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: order }, { data: milestones }, { data: logs }, { data: delays }] = await Promise.all([
    (supabase.from('production_orders') as any)
      .select('*, factories(name), projects(name)')
      .eq('id', id)
      .single(),
    (supabase.from('production_milestones') as any)
      .select('*')
      .eq('production_order_id', id)
      .order('milestone_order', { ascending: true }),
    (supabase.from('production_daily_logs') as any)
      .select('*')
      .eq('production_order_id', id)
      .order('log_date', { ascending: true }),
    (supabase.from('production_delays') as any)
      .select('*')
      .eq('production_order_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!order) {
    return <div className="p-6 lg:p-8 text-center text-muted-foreground">Production order not found.</div>
  }

  return (
    <div className="p-6 lg:p-8">
      <ProductionDetailClient
        order={order}
        milestones={(milestones ?? []) as any[]}
        logs={(logs ?? []) as any[]}
        delays={(delays ?? []) as any[]}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
