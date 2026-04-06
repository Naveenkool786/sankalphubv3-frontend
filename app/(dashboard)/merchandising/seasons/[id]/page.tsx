import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { SeasonDetailClient } from './_components/SeasonDetailClient'

export default async function SeasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: season }, { data: calendar }, { data: styles }] = await Promise.all([
    (supabase.from('seasons') as any).select('*').eq('id', id).single(),
    (supabase.from('seasonal_calendar') as any).select('*').eq('season_id', id).order('planned_date'),
    (supabase.from('styles') as any).select('id, style_number, style_name, category, lifecycle_stage, status').eq('season_id', id).order('style_number'),
  ])

  if (!season) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Season not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <SeasonDetailClient season={season} calendar={(calendar ?? []) as any[]} styles={(styles ?? []) as any[]} canManage={canManage(ctx.role)} />
    </div>
  )
}
