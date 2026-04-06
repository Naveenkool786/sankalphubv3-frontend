import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { StyleListClient } from './_components/StyleListClient'

export default async function StylesPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { data: styles } = await (supabase.from('styles') as any)
    .select('*, seasons(season_code, season_name), factories(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8">
      <StyleListClient styles={(styles ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
