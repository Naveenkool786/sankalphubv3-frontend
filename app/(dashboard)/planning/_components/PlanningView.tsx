'use client'

import { useState } from 'react'
import { Calendar, ClipboardCheck, AlertTriangle, Clock, Plus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PlanningData, OrderRow, FactoryUtilisation } from '@/hooks/usePlanningData'
import { startOfWeek, endOfWeek, format, isSameDay, isWithinInterval } from 'date-fns'

/* ─── COLOR HELPERS ─── */

const getPriorityColor = (p: string) => ({
  high: { bg: '#FCEBEB', text: '#791F1F' },
  medium: { bg: '#FAEEDA', text: '#633806' },
  low: { bg: '#E1F5EE', text: '#085041' },
}[p] ?? { bg: '#F1EFE8', text: '#444441' })

const getStatusColor = (s: string) => ({
  in_production: { bg: '#E6F1FB', text: '#0C447C' },
  in_inspection: { bg: '#EEEDFE', text: '#3C3489' },
  scheduled: { bg: '#EEEDFE', text: '#3C3489' },
  confirmed: { bg: '#EEEDFE', text: '#3C3489' },
  completed: { bg: '#E1F5EE', text: '#085041' },
  delayed: { bg: '#FCEBEB', text: '#791F1F' },
}[s] ?? { bg: '#F1EFE8', text: '#444441' })

/* ─── COMPONENT ─── */

interface Props { data: PlanningData }

export function PlanningView({ data }: Props) {
  const [scheduleFilter, setScheduleFilter] = useState<'day' | 'week' | 'month'>('week')
  const today = new Date()

  const filteredOrders = data.scheduleOrders.filter(o => {
    if (!o.start_date) return scheduleFilter === 'month'
    const d = new Date(o.start_date)
    if (scheduleFilter === 'day') return isSameDay(d, today)
    if (scheduleFilter === 'week') return isWithinInterval(d, { start: startOfWeek(today), end: endOfWeek(today) })
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  })

  const kpis = [
    { icon: Calendar, label: 'Active Orders / POs', value: data.activeOrders, sub: 'This month', iconBg: '#FAEEDA', iconColor: '#854F0B' },
    { icon: ClipboardCheck, label: 'Inspections this week', value: data.thisWeekInspections, sub: `${data.inspectionsDelta >= 0 ? '+' : ''}${data.inspectionsDelta} vs last week`, subColor: data.inspectionsDelta >= 0 ? '#1D9E75' : '#E24B4A', iconBg: '#E6F1FB', iconColor: '#185FA5' },
    { icon: AlertTriangle, label: 'Delayed Orders', value: data.delayedOrders, valueColor: data.delayedOrders > 0 ? '#E24B4A' : undefined, sub: data.delayedOrders > 0 ? 'Needs attention' : 'All on track', subColor: data.delayedOrders > 0 ? '#E24B4A' : '#1D9E75', iconBg: '#FCEBEB', iconColor: '#A32D2D' },
    { icon: Clock, label: 'WIP Items', value: data.wipCount, sub: `Across ${data.activeFactoriesCount} factories`, iconBg: '#EEEDFE', iconColor: '#534AB7' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-medium text-foreground">Production Planning</h2>
          <p className="text-[11px] text-muted-foreground">Schedule optimisation and resource management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8"><Eye size={14} className="mr-1" /> View Calendar</Button>
          <Button size="sm" className="text-xs h-8 gap-1" style={{ background: '#BA7517', color: '#fff', border: 'none' }}>
            <Plus size={14} /> Schedule Order
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: k.iconBg }}>
                  <Icon size={14} style={{ color: k.iconColor }} />
                </div>
                <span className="text-[11px] text-muted-foreground">{k.label}</span>
              </div>
              <p className="text-[22px] font-medium" style={{ color: k.valueColor ?? 'hsl(var(--foreground))' }}>{k.value}</p>
              <p className="text-[10px]" style={{ color: k.subColor ?? 'hsl(var(--muted-foreground))' }}>{k.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-[1fr_260px] gap-4">
        {/* Left — Production Schedule */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Production schedule</h3>
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setScheduleFilter(f)}
                  className={cn('text-[10px] px-2.5 py-1 rounded-full border transition-colors capitalize',
                    scheduleFilter === f ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                  style={scheduleFilter === f ? { backgroundColor: '#BA7517' } : undefined}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No orders scheduled for this {scheduleFilter}</p>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map(o => {
                const pri = getPriorityColor(o.priority)
                const sts = getStatusColor(o.status)
                return (
                  <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-accent/20 transition-colors">
                    <div className="text-[10px] text-muted-foreground w-[70px] shrink-0">
                      {o.time_slot_start && o.time_slot_end ? `${o.time_slot_start.slice(0, 5)} – ${o.time_slot_end.slice(0, 5)}` : o.start_date ? format(new Date(o.start_date), 'MMM d') : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{o.order_number}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{o.factoryName ?? 'No factory'} &middot; {o.product_category}</p>
                    </div>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: pri.bg, color: pri.text }}>{o.priority}</span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: sts.bg, color: sts.text }}>{o.status.replace(/_/g, ' ')}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right — Resource Availability */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-1">Resource availability</h3>
          <p className="text-[10px] text-muted-foreground mb-3">Current capacity status</p>

          {data.factoryUtilisation.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No active factories</p>
          ) : (
            <div className="space-y-3">
              {data.factoryUtilisation.map(fu => {
                const barColor = fu.utilisationPct >= 100 ? '#E24B4A' : fu.utilisationPct >= 80 ? '#EF9F27' : '#C9A96E'
                return (
                  <div key={fu.factory.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-foreground truncate">{fu.factory.name}</span>
                      <span className="text-[10px]" style={{ color: fu.utilisationPct >= 100 ? '#E24B4A' : 'hsl(var(--muted-foreground))' }}>
                        {fu.utilisationPct}%{fu.utilisationPct >= 100 ? ' — at capacity' : ' utilisation'}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(fu.utilisationPct, 100)}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <Button
            className="w-full mt-4 text-xs h-8"
            style={{ background: '#BA7517', color: '#fff', border: 'none' }}
          >
            Optimise Schedule
          </Button>
        </div>
      </div>
    </div>
  )
}
