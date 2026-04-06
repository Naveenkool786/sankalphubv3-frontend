import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEASON_STATUS_CONFIG, SEASON_TYPE_CONFIG, type SeasonStatus, type SeasonType } from '@/lib/types/merchandising'

export default async function SeasonsPage() {
  const ctx = await getUserContext()
  const supabase = createAdminClient()
  const { data: seasons } = await (supabase.from('seasons') as any).select('*').order('year', { ascending: false }).order('season_code')

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Calendar className="w-5 h-5" style={{ color: '#D4A843' }} /> Seasons</h1>
          <p className="text-sm text-muted-foreground mt-1">{(seasons ?? []).length} seasons</p>
        </div>
        {canManage(ctx.role) && (
          <Link href="/merchandising/seasons/new"><Button size="sm" className="gap-1.5" style={{ backgroundColor: '#D4A843' }}><Plus className="w-4 h-4" /> New Season</Button></Link>
        )}
      </div>
      {(seasons ?? []).length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center"><p className="text-sm text-muted-foreground">No seasons yet</p></div>
      ) : (
        <div className="space-y-3">
          {(seasons ?? []).map((s: any) => {
            const cfg = SEASON_STATUS_CONFIG[s.status as SeasonStatus] || SEASON_STATUS_CONFIG.planning
            return (
              <Link key={s.id} href={`/merchandising/seasons/${s.id}`} className="block">
                <div className="bg-card rounded-xl border border-border p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{s.season_code}</span>
                      <span className="text-xs text-muted-foreground">{s.season_name}</span>
                      {s.season_type && <Badge variant="secondary" className="text-[10px]">{SEASON_TYPE_CONFIG[s.season_type as SeasonType]?.label}</Badge>}
                      <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} className="text-[10px]">{cfg.label}</Badge>
                    </div>
                    <span className="text-xs font-mono">{s.target_styles} styles · {s.target_units?.toLocaleString()} units</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.start_date || '—'} → {s.end_date || '—'}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
