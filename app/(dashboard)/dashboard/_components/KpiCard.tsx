'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KpiSubMetric {
  label: string
  value: string | number
  dotColor: string
}

export interface KpiCardProps {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  industryAvg?: string
  value: string
  delta: number
  progressPercent: number
  progressColor: string
  detailRows: { label: string; value: string }[]
  subMetrics: KpiSubMetric[]
}

export function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  industryAvg,
  value,
  delta,
  progressPercent,
  progressColor,
  detailRows,
  subMetrics,
}: KpiCardProps) {
  const isUp = delta >= 0

  return (
    <div className="rounded-[10px] border border-border bg-card p-3.5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon size={14} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-foreground truncate">{title}</p>
          {industryAvg && <p className="text-[9px] text-muted-foreground">Industry avg: {industryAvg}</p>}
        </div>
      </div>

      {/* Value + delta */}
      <div className="flex items-end gap-2 mt-2 mb-2">
        <span className="text-[26px] font-medium text-foreground leading-none">{value}</span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 mb-0.5"
          style={{
            backgroundColor: isUp ? '#E1F5EE' : '#FCEBEB',
            color: isUp ? '#085041' : '#791F1F',
          }}
        >
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isUp ? '+' : ''}{delta.toFixed(1)}%
        </span>
      </div>

      {/* Progress rows */}
      {detailRows.map((row, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-foreground font-medium">{row.value}</span>
          </div>
          {i === 0 && (
            <div className="h-1 rounded-full bg-muted overflow-hidden mb-1.5">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(progressPercent, 100)}%`, backgroundColor: progressColor }} />
            </div>
          )}
        </div>
      ))}

      {/* Sub metrics */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border">
        {subMetrics.map((sm) => (
          <div key={sm.label}>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sm.dotColor }} />
              <span className="text-xs font-medium text-foreground">{sm.value}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{sm.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
