import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { PODetailClient } from './_components/PODetailClient'

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: po }, { data: items }] = await Promise.all([
    (supabase.from('purchase_orders') as any).select('*, projects(name), factories(name)').eq('id', id).single(),
    (supabase.from('po_items') as any).select('*').eq('purchase_order_id', id).order('created_at'),
  ])

  if (!po) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Purchase order not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <PODetailClient po={po} items={(items ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
