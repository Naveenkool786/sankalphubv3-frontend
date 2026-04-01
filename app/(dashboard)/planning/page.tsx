'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, Calendar, FileText, Clock, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePlanningData } from '@/hooks/usePlanningData'
import { PlanningView } from './_components/PlanningView'
import { TimelineView } from './_components/TimelineView'
import { DprView } from './_components/DprView'

type View = 'planning' | 'timeline' | 'dpr'

const VIEW_OPTIONS: { key: View; label: string; icon: typeof Calendar }[] = [
  { key: 'planning', label: 'Production Planning', icon: Calendar },
  { key: 'timeline', label: 'Production Timeline', icon: BarChart3 },
  { key: 'dpr', label: 'Daily Progress Report (DPR)', icon: FileText },
]

export default function PlanningPage() {
  const [activeView, setActiveView] = useState<View>('planning')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [viewMonth, setViewMonth] = useState(new Date())

  const data = usePlanningData(selectedDate, viewMonth)

  const activeLabel = VIEW_OPTIONS.find(v => v.key === activeView)?.label ?? 'Production Planning'

  return (
    <div className="p-6 lg:p-8">
      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* View switcher dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="gap-2 text-sm font-medium h-9 px-4"
              style={{ backgroundColor: '#C9A96E', color: '#412402', border: 'none' }}
            >
              {activeLabel} <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {VIEW_OPTIONS.map(v => {
              const Icon = v.icon
              const isActive = activeView === v.key
              return (
                <DropdownMenuItem
                  key={v.key}
                  onClick={() => setActiveView(v.key)}
                  className="gap-2.5 py-2"
                  style={isActive ? { backgroundColor: '#FAEEDA', color: '#633806', fontWeight: 500 } : undefined}
                >
                  <Icon size={16} />
                  {v.label}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-2.5 py-2 opacity-50">
              <Clock size={16} />
              WIP Tracker
              <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0" style={{ backgroundColor: '#FAEEDA', color: '#633806' }}>
                Soon
              </Badge>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* WIP counter */}
        <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-xs">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">WIP</span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
          >
            {data.loading ? '…' : data.wipCount}
          </span>
        </div>
      </div>

      {/* ── LOADING STATE ── */}
      {data.loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground">Loading planning data...</p>
        </div>
      ) : (
        <>
          {activeView === 'planning' && <PlanningView data={data} />}
          {activeView === 'timeline' && <TimelineView data={data} viewMonth={viewMonth} onMonthChange={setViewMonth} />}
          {activeView === 'dpr' && <DprView data={data} selectedDate={selectedDate} onDateChange={setSelectedDate} />}
        </>
      )}
    </div>
  )
}
