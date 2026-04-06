import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { StyleDetailClient } from './_components/StyleDetailClient'

export default async function StyleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const [{ data: style }, { data: colorways }, { data: bom }, { data: orders }, { data: techPacks }] = await Promise.all([
    (supabase.from('styles') as any).select('*, seasons(season_code, season_name), factories(name)').eq('id', id).single(),
    (supabase.from('colorways') as any).select('*').eq('style_id', id).order('sort_order'),
    (supabase.from('style_bom') as any).select('*').eq('style_id', id).order('item_order'),
    (supabase.from('order_bookings') as any).select('*, colorways(color_name, color_code)').eq('style_id', id).order('created_at', { ascending: false }),
    (supabase.from('tech_packs') as any).select('*').eq('style_id', id).order('version', { ascending: false }),
  ])

  if (!style) return <div className="p-6 lg:p-8 text-center text-muted-foreground">Style not found.</div>

  return (
    <div className="p-6 lg:p-8">
      <StyleDetailClient
        style={style} colorways={(colorways ?? []) as any[]}
        bom={(bom ?? []) as any[]} orders={(orders ?? []) as any[]}
        techPacks={(techPacks ?? []) as any[]}
        canManage={canManage(ctx.role)}
      />
    </div>
  )
}
