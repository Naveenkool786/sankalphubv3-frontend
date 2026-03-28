import { cn } from '@/lib/utils'

interface MetricChartCardProps {
  title: string
  value: string | number
  previousValue?: string | number
  previousLabel?: string
  trend?: number
  actionLabel?: string
  sparklineData?: number[]
  className?: string
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 200
  const h = 60
  const padding = 4

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2)
    const y = padding + (1 - (v - min) / range) * (h - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${padding},${h - padding} ${points} ${w - padding},${h - padding}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16 mt-3" preserveAspectRatio="none">
      <polygon points={areaPoints} fill="rgba(16,185,129,0.08)" />
      <polyline points={points} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Current value dot */}
      {data.length > 0 && (() => {
        const lastX = padding + ((data.length - 1) / (data.length - 1)) * (w - padding * 2)
        const lastY = padding + (1 - (data[data.length - 1] - min) / range) * (h - padding * 2)
        return <circle cx={lastX} cy={lastY} r="3" fill="#10B981" />
      })()}
    </svg>
  )
}

export function MetricChartCard({
  title,
  value,
  previousValue,
  previousLabel,
  trend,
  actionLabel,
  sparklineData,
  className,
}: MetricChartCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {actionLabel && (
          <span className="text-xs font-medium" style={{ color: '#C9A96E' }}>{actionLabel}</span>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-foreground">{value}</p>

      {/* Trend + previous */}
      <div className="flex items-center gap-2 mt-1">
        {trend !== undefined && (
          <span className={cn('text-xs font-semibold', trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        {previousValue !== undefined && previousLabel && (
          <span className="text-xs text-muted-foreground">
            {previousValue} {previousLabel}
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <Sparkline data={sparklineData} />
      )}
    </div>
  )
}
