'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SEASON_STATUS_CONFIG, LIFECYCLE_CONFIG, type Season, type SeasonStatus, type LifecycleStage } from '@/lib/types/merchandising'
import { updateSeasonStatus, updateCalendarMilestone } from '@/lib/actions/merchandising'

interface Props { season: Season; calendar: any[]; styles: any[]; canManage: boolean }

export function SeasonDetailClient({ season, calendar, styles, canManage }: Props) {
  const cfg = SEASON_STATUS_CONFIG[season.status] || SEASON_STATUS_CONFIG.planning
  const [statusLoading, setStatusLoading] = useState('')

  const handleStatus = async (status: string) => {
    setStatusLoading(status)
    const result = await updateSeasonStatus(season.id, status)
    setStatusLoading('')
    if (result.success) toast.success('Status updated')
    else toast.error('Failed', { description: result.error })
  }

  const handleMilestoneComplete = async (milestoneId: string) => {
    const result = await updateCalendarMilestone(milestoneId, { status: 'completed', actual_date: new Date().toISOString().split('T')[0] })
    if (result.success) toast.success('Milestone completed')
    else toast.error('Failed', { description: result.error })
  }

  return (
    <div>
      <Link href="/merchandising/seasons" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Seasons
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{season.season_code}</h1>
            <span className="text-sm text-muted-foreground">{season.season_name}</span>
            <Badge style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{season.start_date || '—'} → {season.end_date || '—'} · {season.target_styles} styles · {season.target_units?.toLocaleString()} units</p>
        </div>
        {canManage && season.status !== 'archived' && (
          <div className="flex gap-1">
            {season.status === 'planning' && <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatus('development')} disabled={!!statusLoading}>Start Development</Button>}
            {season.status === 'development' && <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatus('selling')} disabled={!!statusLoading}>Open for Selling</Button>}
            {season.status === 'selling' && <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatus('production')} disabled={!!statusLoading}>Move to Production</Button>}
          </div>
        )}
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="bg-muted/50 mb-4">
          <TabsTrigger value="calendar">Calendar ({calendar.length})</TabsTrigger>
          <TabsTrigger value="styles">Styles ({styles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {calendar.map(m => {
                const isCompleted = m.status === 'completed'
                const isDelayed = m.status === 'delayed'
                const isPast = m.planned_date && new Date(m.planned_date) < new Date() && !isCompleted
                return (
                  <div key={m.id} className={cn('px-4 py-3 flex items-center justify-between', isCompleted && 'bg-green-50/30', isDelayed && 'bg-red-50/30')}>
                    <div className="flex items-center gap-3">
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                        isCompleted ? 'bg-green-500 text-white' : isDelayed ? 'bg-red-500 text-white' : isPast ? 'bg-orange-400 text-white' : 'bg-muted'
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : isDelayed ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className="text-xs font-medium">{m.milestone_name}</span>
                        <p className="text-[10px] text-muted-foreground">Planned: {m.planned_date} {m.actual_date ? `· Actual: ${m.actual_date}` : ''}</p>
                      </div>
                    </div>
                    {canManage && !isCompleted && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleMilestoneComplete(m.id)}>Complete</Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="styles">
          {styles.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">No styles in this season</div>
          ) : (
            <div className="space-y-2">
              {styles.map((s: any) => {
                const lc = LIFECYCLE_CONFIG[s.lifecycle_stage as LifecycleStage]
                return (
                  <Link key={s.id} href={`/merchandising/styles/${s.id}`} className="block">
                    <div className="bg-card rounded-xl border border-border p-3 hover:bg-muted/20 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold font-mono">{s.style_number}</span>
                        <span className="text-xs text-muted-foreground">{s.style_name}</span>
                        {s.category && <Badge variant="secondary" className="text-[10px] capitalize">{s.category}</Badge>}
                      </div>
                      {lc && <Badge style={{ backgroundColor: lc.bg, color: lc.color }} className="text-[10px]">{lc.label}</Badge>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
