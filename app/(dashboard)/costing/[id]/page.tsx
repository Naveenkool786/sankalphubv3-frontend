import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { CostSheetDetailClient } from './_components/CostSheetDetailClient'

export default async function CostSheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: sheet }, { data: items }] = await Promise.all([
    (supabase.from('cost_sheets') as any).select('*, projects(name)').eq('id', id).single(),
    (supabase.from('cost_sheet_items') as any).select('*').eq('cost_sheet_id', id).order('item_order'),
  ])

  if (!sheet) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Cost sheet not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <CostSheetDetailClient sheet={sheet} items={(items ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
