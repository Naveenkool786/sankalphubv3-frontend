import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { QuotationListClient } from './_components/QuotationListClient'

export default async function QuotationsPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: quotations } = await (supabase.from('quotations') as any)
    .select('*, projects!inner(name, org_id), factories(name)')
    .eq('projects.org_id', ctx.orgId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <QuotationListClient quotations={(quotations ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
