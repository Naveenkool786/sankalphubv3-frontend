import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import { ShipmentListClient } from './_components/ShipmentListClient'

export default async function LogisticsPage() {
  if (!FEATURE_FLAGS.LOGISTICS_ENABLED) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <div className="bg-card rounded-xl border border-border p-12 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-2">Logistics & Shipping</h2>
          <p className="text-sm text-muted-foreground mb-4">This module is a paid add-on. Contact us to enable it.</p>
        </div>
      </div>
    )
  }

  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: shipments } = await (supabase.from('shipments') as any)
    .select('*, projects!inner(name, org_id)')
    .eq('projects.org_id', ctx.orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <ShipmentListClient shipments={(shipments ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
