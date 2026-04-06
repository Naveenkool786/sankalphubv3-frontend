import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { QuotationDetailClient } from './_components/QuotationDetailClient'

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: quotation }, { data: items }] = await Promise.all([
    (supabase.from('quotations') as any).select('*, projects(name), factories(name)').eq('id', id).single(),
    (supabase.from('quotation_items') as any).select('*').eq('quotation_id', id).order('created_at'),
  ])

  if (!quotation) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Quotation not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <QuotationDetailClient quotation={quotation} items={(items ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
