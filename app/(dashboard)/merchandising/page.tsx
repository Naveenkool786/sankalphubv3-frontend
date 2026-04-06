import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Layers, FolderKanban, Palette, ShoppingBag, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SEASON_STATUS_CONFIG, LIFECYCLE_CONFIG, type SeasonStatus, type LifecycleStage } from '@/lib/types/merchandising'

export default async function MerchandisingPage() {
  const supabase = createAdminClient()

  const [{ data: seasons }, { data: styles }, { data: orders }] = await Promise.all([
    (supabase.from('seasons') as any).select('*').neq('status', 'archived').order('year', { ascending: false }),
    (supabase.from('styles') as any).select('id, lifecycle_stage, status').eq('status', 'active'),
    (supabase.from('order_bookings') as any).select('total_units, total_value').neq('status', 'cancelled'),
  ])

  const activeStyles = (styles ?? []).length
  const inDev = (styles ?? []).filter((s: any) => ['concept', 'design', 'tech_pack'].includes(s.lifecycle_stage)).length
  const totalOrderUnits = (orders ?? []).reduce((s: number, o: any) => s + (o.total_units || 0), 0)
  const totalOrderValue = (orders ?? []).reduce((s: number, o: any) => s + (o.total_value || 0), 0)

  // Lifecycle funnel
  const lifecycleCounts: Record<string, number> = {}
  ;(styles ?? []).forEach((s: any) => { lifecycleCounts[s.lifecycle_stage] = (lifecycleCounts[s.lifecycle_stage] || 0) + 1 })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5" style={{ color: '#D4A843' }} /> Merchandising
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Pre-production product lifecycle management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <Calendar className="w-4 h-4 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{(seasons ?? []).length}</p>
          <p className="text-[10px] text-muted-foreground">Active Seasons</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <Palette className="w-4 h-4 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{activeStyles}</p>
          <p className="text-[10px] text-muted-foreground">Total Styles</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <FolderKanban className="w-4 h-4 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{inDev}</p>
          <p className="text-[10px] text-muted-foreground">In Development</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <ShoppingBag className="w-4 h-4 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{totalOrderUnits.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Orders (${totalOrderValue.toLocaleString()})</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Seasons', href: '/merchandising/seasons' },
          { label: 'Style Library', href: '/merchandising/styles' },
          { label: 'Orders', href: '/merchandising/orders' },
          { label: 'New Style', href: '/merchandising/styles/new' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="bg-card rounded-xl border border-border p-3 hover:bg-muted/20 transition-colors text-center text-xs font-medium">
            {l.label}
          </Link>
        ))}
      </div>

      {/* Lifecycle funnel */}
      {activeStyles > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">Style Lifecycle</h3>
          <div className="space-y-1.5">
            {Object.entries(LIFECYCLE_CONFIG).filter(([k]) => k !== 'discontinued').map(([k, v]) => {
              const count = lifecycleCounts[k] || 0
              const pct = activeStyles > 0 ? (count / activeStyles) * 100 : 0
              return (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-muted-foreground">{v.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: v.color }} />
                  </div>
                  <span className="w-8 text-right font-mono font-semibold">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Seasons */}
      {(seasons ?? []).length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Seasons</h3>
            <Link href="/merchandising/seasons" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {(seasons ?? []).slice(0, 5).map((s: any) => {
              const cfg = SEASON_STATUS_CONFIG[s.status as SeasonStatus] || SEASON_STATUS_CONFIG.planning
              return (
                <Link key={s.id} href={`/merchandising/seasons/${s.id}`} className="block px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{s.season_code}</span>
                      <span className="text-xs text-muted-foreground">{s.season_name}</span>
                      <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }} className="text-[10px]">{cfg.label}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{s.target_styles} styles · {s.target_units} units</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
