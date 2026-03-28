import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface ConsoleKpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  className?: string
}

export function ConsoleKpiCard({ title, value, icon: Icon, trend, trendUp, className }: ConsoleKpiCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {trend && (
        <p className={cn('text-xs mt-1 font-medium', trendUp ? 'text-emerald-500' : 'text-red-500')}>
          {trendUp ? '↑' : '↓'} {trend}
        </p>
      )}
    </div>
  )
}
