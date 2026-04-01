'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { PlanningData } from '@/hooks/usePlanningData'
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, addDays } from 'date-fns'

interface Props {
  data: PlanningData
  viewMonth: Date
  onMonthChange: (d: Date) => void
}

const CATEGORIES = ['All', 'Garments', 'Footwear', 'Gloves', 'Headwear', 'Accessories']

const LEGEND = [
  { label: 'On track', color: '#1D9E75' },
  { label: 'Delayed', color: '#E24B4A' },
  { label: 'In production', color: '#378ADD' },
  { label: 'In inspection', color: '#534AB7' },
  { label: 'Scheduled', color: '#C9A96E' },
]

export function TimelineView({ data, viewMonth, onMonthChange }: Props) {
  const [categoryFilter, setCategoryFilter] = useState('All')

  const daysInMonth = getDaysInMonth(viewMonth)
  const monthStart = startOfMonth(viewMonth)

  // Generate date markers (every ~5 days)
  const dateMarkers: { label: string; pct: number }[] = []
  for (let d = 0; d < daysInMonth; d += Math.max(1, Math.floor(daysInMonth / 7))) {
    dateMarkers.push({
      label: format(addDays(monthStart, d), 'MMM d'),
      pct: (d / daysInMonth) * 100,
    })
  }

  const filtered = categoryFilter === 'All'
    ? data.timelineOrders
    : data.timelineOrders.filter(o => o.product_category.toLowerCase() === categoryFilter.toLowerCase())

  const kpis = [
    { icon: Calendar, label: 'Active Orders', value: data.totalOrders, iconBg: '#FAEEDA', iconColor: '#854F0B' },
    { icon: CheckCircle2, label: 'On Track', value: data.onTrack, iconBg: '#E1F5EE', iconColor: '#1D9E75' },
    { icon: AlertTriangle, label: 'Delayed', value: data.delayedCount, valueColor: data.delayedCount > 0 ? '#E24B4A' : undefined, iconBg: '#FCEBEB', iconColor: '#A32D2D' },
    { icon: Clock, label: 'Due This Month', value: data.dueThisMonth, iconBg: '#E6F1FB', iconColor: '#185FA5' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-medium text-foreground">Production Timeline</h2>
          <p className="text-[11px] text-muted-foreground">Order timeline connected to all active POs and deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMonthChange(subMonths(viewMonth, 1))}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onMonthChange(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onMonthChange(addMonths(viewMonth, 1))}>
            <ChevronRight size={16} />
          </Button>
          <span className="text-sm font-medium text-foreground ml-2">{format(viewMonth, 'MMMM yyyy')}</span>
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
            </div>
          )
        })}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs rounded-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} orders</span>
      </div>

      {/* Gantt Chart */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Date header */}
        <div className="relative h-8 border-b border-border bg-muted/30">
          {dateMarkers.map((m, i) => (
            <span
              key={i}
              className="absolute text-[9px] text-muted-foreground top-2"
              style={{ left: `${m.pct}%`, transform: 'translateX(-50%)' }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Order rows */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No orders to display</div>
        ) : (
          filtered.map(o => (
            <div key={o.id} className="relative h-12 border-b border-border last:border-0 hover:bg-accent/10 transition-colors">
              {/* Row label */}
              <div className="absolute left-2 top-1 z-10">
                <p className="text-[10px] font-medium text-foreground">{o.order_number}</p>
                <p className="text-[9px] text-muted-foreground">{o.factoryName ?? 'No factory'}</p>
              </div>
              {/* Bar */}
              <div
                className="absolute top-2 h-7 rounded flex items-center px-2 overflow-hidden"
                style={{
                  left: `${Math.max(o.leftPct, 12)}%`,
                  width: `${o.widthPct}%`,
                  backgroundColor: o.color,
                  minWidth: '40px',
                }}
              >
                <span
                  className="text-[9px] font-medium truncate"
                  style={{ color: o.color === '#C9A96E' ? '#412402' : '#fff' }}
                >
                  {o.product_category} &middot; {o.quantity.toLocaleString()} pcs
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
