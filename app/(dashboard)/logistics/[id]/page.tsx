import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { ShipmentDetailClient } from './_components/ShipmentDetailClient'

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: shipment }, { data: milestones }, { data: packingItems }, { data: documents }] = await Promise.all([
    (supabase.from('shipments') as any).select('*, projects(name)').eq('id', id).single(),
    (supabase.from('shipment_milestones') as any).select('*').eq('shipment_id', id).order('milestone_order'),
    (supabase.from('packing_lists') as any).select('*').eq('shipment_id', id).order('carton_number'),
    (supabase.from('shipping_documents') as any).select('*').eq('shipment_id', id).order('created_at'),
  ])

  if (!shipment) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Shipment not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <ShipmentDetailClient
        shipment={shipment}
        milestones={(milestones ?? []) as any[]}
        packingItems={(packingItems ?? []) as any[]}
        documents={(documents ?? []) as any[]}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
