'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InspectionStatus, InspectionResult, InspectionType } from '@/types/database'

export type InspectionRow = {
  id: string
  inspection_no: string
  inspection_type: InspectionType
  status: InspectionStatus
  result: InspectionResult
  inspection_date: string
  auditor_name: string | null
  quantity_inspected: number
  sample_size: number
  score: number | null
  critical_defects: number
  major_defects: number
  minor_defects: number
  aql_level: string
  remarks: string | null
  template_name: string | null
  project_id: string | null
  factory_id: string | null
  created_at: string
  projects: { name: string } | null
  factories: { name: string } | null
}

export const INSPECTION_STATUS_CONFIG: Record<InspectionStatus, { label: string; cls: string }> = {
  draft:          { label: 'Draft',          cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  scheduled:      { label: 'Scheduled',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  confirmed:      { label: 'Confirmed',      cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  in_progress:    { label: 'In Progress',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  report_pending: { label: 'Report Pending', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  submitted:      { label: 'Submitted',      cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  approved:       { label: 'Approved',       cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:      { label: 'Cancelled',      cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
}

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  pre_production: 'Pre-Production',
  inline:         'Inline',
  final:          'Final',
  lab_test:       'Lab Test',
  fri:            'FRI',
  dupro:          'Dupro',
  pre_final:      'Pre-Final',
}

function ResultIcon({ result }: { result: InspectionResult }) {
  if (result === 'pass') {
    return (
      <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
      </div>
    )
  }
  if (result === 'fail') {
    return (
      <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
        <XCircle className="w-5 h-5 text-red-500" />
      </div>
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
      <Clock className="w-5 h-5 text-amber-500" />
    </div>
  )
}

interface Props {
  inspection: InspectionRow
  onClick: (inspection: InspectionRow) => void
}

export function InspectionRow({ inspection: insp, onClick }: Props) {
  const sc = INSPECTION_STATUS_CONFIG[insp.status]
  const score = insp.score ?? 0

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onClick(insp)}
    >
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-4">
          <ResultIcon result={insp.result} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground truncate">
                {insp.projects?.name ?? '—'}
              </p>
              <Badge className={cn('text-[10px] px-1.5 py-0 border-0', sc.cls)}>
                {sc.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {INSPECTION_TYPE_LABELS[insp.inspection_type]}
              {insp.factories?.name && ` · ${insp.factories.name}`}
              {insp.auditor_name && ` · ${insp.auditor_name}`}
              {` · ${new Date(insp.inspection_date).toLocaleDateString()}`}
            </p>
          </div>

          {/* Defects */}
          <div className="hidden md:flex items-center gap-3 text-xs flex-shrink-0">
            {insp.critical_defects > 0 && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="w-3 h-3" /> {insp.critical_defects} Critical
              </span>
            )}
            {insp.major_defects > 0 && (
              <span className="text-orange-500">{insp.major_defects} Major</span>
            )}
            {insp.minor_defects > 0 && (
              <span className="text-muted-foreground">{insp.minor_defects} Minor</span>
            )}
          </div>

          {/* Score */}
          <div className="text-right flex-shrink-0">
            <div className={cn(
              'text-xl font-bold',
              score >= 80 ? 'text-green-600' : score > 0 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {score > 0 ? score : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground">Score</div>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}
