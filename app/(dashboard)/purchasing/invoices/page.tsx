import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { InvoiceListClient } from './_components/InvoiceListClient'

export default async function InvoicesPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: invoices }, { data: pos }] = await Promise.all([
    (supabase.from('invoices') as any)
      .select('*, purchase_orders(po_number, total_amount, supplier_name)')
      .order('created_at', { ascending: false }),
    (supabase.from('purchase_orders') as any)
      .select('id, po_number, supplier_name, total_amount')
      .order('po_number'),
  ])

  return (
    <div className="p-6 lg:p-8">
      <InvoiceListClient invoices={(invoices ?? []) as any[]} pos={(pos ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
