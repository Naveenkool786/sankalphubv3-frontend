'use client'

import { Package, ClipboardCheck, AlertTriangle, Clock, FileDown, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PlanningData } from '@/hooks/usePlanningData'

interface Props {
  data: PlanningData
  selectedDate: string
  onDateChange: (d: string) => void
}

const getStatusColor = (s: string) => ({
  in_production: { bg: '#E6F1FB', text: '#0C447C' },
  delayed: { bg: '#FCEBEB', text: '#791F1F' },
  scheduled: { bg: '#EEEDFE', text: '#3C3489' },
  confirmed: { bg: '#EEEDFE', text: '#3C3489' },
  completed: { bg: '#E1F5EE', text: '#085041' },
}[s] ?? { bg: '#F1EFE8', text: '#444441' })

export function DprView({ data, selectedDate, onDateChange }: Props) {
  const achievementColor = data.overallAchievement >= 90 ? '#1D9E75' : data.overallAchievement >= 70 ? '#EF9F27' : '#E24B4A'

  const kpis = [
    {
      icon: Package, label: 'Total units produced', iconBg: '#E1F5EE', iconColor: '#1D9E75',
      value: data.totalProduced.toLocaleString(),
      sub: `${data.overallAchievement}% of target`, subColor: achievementColor,
    },
    {
      icon: ClipboardCheck, label: 'Inspections done', iconBg: '#E6F1FB', iconColor: '#185FA5',
      value: data.todayInspectionsCount,
      sub: `${data.overallPassRate}% pass rate`, subColor: data.overallPassRate >= 80 ? '#1D9E75' : '#EF9F27',
    },
    {
      icon: AlertTriangle, label: 'Total defects', iconBg: '#FCEBEB', iconColor: '#A32D2D',
      value: data.totalDefectsToday, valueColor: data.totalDefectsToday > 0 ? '#E24B4A' : undefined,
      sub: `${data.criticalToday} critical · ${data.majorToday} major`,
      subColor: data.criticalToday > 0 ? '#E24B4A' : 'hsl(var(--muted-foreground))',
    },
    {
      icon: Clock, label: 'Avg cycle time', iconBg: '#EEEDFE', iconColor: '#534AB7',
      value: data.avgCycleTime != null ? `${data.avgCycleTime} min` : '—',
      sub: 'Per unit average',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-medium text-foreground">Daily Progress Report</h2>
          <p className="text-[11px] text-muted-foreground">
            Production output + quality summary — {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground"
          />
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1" onClick={() => window.print()}>
            <FileDown size={14} /> Export PDF
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
            <Share2 size={14} /> Share Report
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

      {/* Per-factory cards */}
      {data.factoryDPR.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-xs text-muted-foreground">
          No factory data for this date
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.factoryDPR.map(f => {
            const sts = getStatusColor(f.status)
            return (
              <div key={f.factory.id} className="rounded-lg border border-border bg-card p-4">
                {/* Factory header */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-foreground">{f.factory.name}</h4>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: sts.bg, color: sts.text }}>
                    {f.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* 3-metric row */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Units today</p>
                    <p className="text-sm font-medium text-foreground">{f.produced.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Target</p>
                    <p className="text-sm font-medium text-foreground">{f.target.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Achieved</p>
                    <p className="text-sm font-medium" style={{ color: f.progressColor }}>{f.achievement}%</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Production progress</span>
                  <span className="text-foreground font-medium">{f.produced.toLocaleString()} / {f.target.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(f.achievement, 100)}%`, backgroundColor: f.progressColor }} />
                </div>

                {/* Quality summary */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-md p-2 text-center" style={{ backgroundColor: '#E1F5EE' }}>
                    <p className="text-[10px]" style={{ color: '#085041' }}>Pass rate</p>
                    <p className="text-xs font-medium" style={{ color: '#085041' }}>{f.passRate}%</p>
                  </div>
                  <div className="rounded-md p-2 text-center" style={{ backgroundColor: '#FCEBEB' }}>
                    <p className="text-[10px]" style={{ color: '#791F1F' }}>Critical</p>
                    <p className="text-xs font-medium" style={{ color: f.critical > 0 ? '#791F1F' : '#791F1F' }}>{f.critical}</p>
                  </div>
                  <div className="rounded-md p-2 text-center" style={{ backgroundColor: '#FAEEDA' }}>
                    <p className="text-[10px]" style={{ color: '#633806' }}>Major</p>
                    <p className="text-xs font-medium" style={{ color: '#633806' }}>{f.major}</p>
                  </div>
                  <div className="rounded-md p-2 text-center" style={{ backgroundColor: '#E1F5EE' }}>
                    <p className="text-[10px]" style={{ color: '#085041' }}>Minor</p>
                    <p className="text-xs font-medium" style={{ color: '#085041' }}>{f.minor}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
