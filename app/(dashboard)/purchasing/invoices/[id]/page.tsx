import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { InvoiceDetailClient } from './_components/InvoiceDetailClient'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: invoice } = await (supabase.from('invoices') as any)
    .select('*, purchase_orders(po_number, total_amount, supplier_name)')
    .eq('id', id)
    .single()

  if (!invoice) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Invoice not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <InvoiceDetailClient invoice={invoice} canManage={canManage(ctx.role)} />
    </div>
  )
}
