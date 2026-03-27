'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MapPin, Package, Calendar, User, FileText, ChevronDown, Trash2, Loader2,
  AlertTriangle, CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  INSPECTION_STATUS_CONFIG, INSPECTION_TYPE_LABELS, type InspectionRow,
} from './InspectionRow'
import { updateInspectionStatus, deleteInspection } from '../actions'
import type { InspectionStatus } from '@/types/database'

interface Props {
  inspection: InspectionRow | null
  open: boolean
  onClose: () => void
  canManage: boolean
}

const ALL_STATUSES: InspectionStatus[] = [
  'draft', 'scheduled', 'confirmed', 'in_progress', 'report_pending', 'submitted', 'approved', 'cancelled',
]

export function InspectionDetailDialog({ inspection, open, onClose, canManage }: Props) {
  const [deleting, setDeleting] = useState(false)

  if (!inspection) return null

  const sc = INSPECTION_STATUS_CONFIG[inspection.status]

  const handleStatusChange = async (status: InspectionStatus) => {
    try {
      await updateInspectionStatus(inspection.id, status)
      toast.success(`Status changed to ${INSPECTION_STATUS_CONFIG[status].label}`)
      onClose()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete inspection ${inspection.inspection_no}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteInspection(inspection.id)
      toast.success('Inspection deleted')
      onClose()
    } catch {
      toast.error('Failed to delete inspection')
    } finally {
      setDeleting(false)
    }
  }

  const score = inspection.score ?? 0

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-base">{inspection.projects?.name ?? 'Inspection'}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {inspection.inspection_no} · {INSPECTION_TYPE_LABELS[inspection.inspection_type]}
              </p>
            </div>
            <Badge className={cn('text-[10px] px-1.5 py-0 border-0 mt-0.5', sc.cls)}>
              {sc.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Score bar */}
          <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex-shrink-0">
              {inspection.result === 'pass' ? (
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              ) : inspection.result === 'fail' ? (
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Result</p>
              <p className="text-sm font-medium capitalize">{inspection.result.replace('_', ' ')}</p>
            </div>
            <div className="text-right">
              <div className={cn(
                'text-2xl font-bold',
                score >= 80 ? 'text-green-600' : score > 0 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {score > 0 ? score : '—'}
              </div>
              <div className="text-[10px] text-muted-foreground">Score</div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'FACTORY',  icon: MapPin,     value: inspection.factories?.name },
              { label: 'DATE',     icon: Calendar,   value: new Date(inspection.inspection_date).toLocaleDateString() },
              { label: 'AUDITOR',  icon: User,       value: inspection.auditor_name ?? 'Unassigned' },
              { label: 'AQL',      icon: FileText,   value: inspection.aql_level },
              { label: 'QTY INSP', icon: Package,    value: inspection.quantity_inspected ? inspection.quantity_inspected.toLocaleString() : null },
              { label: 'SAMPLE',   icon: Package,    value: inspection.sample_size ? inspection.sample_size.toLocaleString() : null },
              { label: 'TEMPLATE', icon: FileText,   value: inspection.template_name },
            ].map(({ label, icon: Icon, value }) => (
              <div key={label} className="space-y-0.5">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">{label}</p>
                <div className="flex items-center gap-1 text-sm text-foreground">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span>{value ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Defect counts */}
          {(inspection.critical_defects > 0 || inspection.major_defects > 0 || inspection.minor_defects > 0) && (
            <div className="p-3 bg-muted/40 rounded-lg space-y-2">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">DEFECTS</p>
              <div className="flex gap-4 text-sm">
                {inspection.critical_defects > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> {inspection.critical_defects} Critical
                  </span>
                )}
                {inspection.major_defects > 0 && (
                  <span className="text-orange-500 font-medium">{inspection.major_defects} Major</span>
                )}
                {inspection.minor_defects > 0 && (
                  <span className="text-muted-foreground">{inspection.minor_defects} Minor</span>
                )}
              </div>
            </div>
          )}

          {/* Remarks */}
          {inspection.remarks && (
            <div className="p-3 bg-muted/40 rounded-lg space-y-1">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">REMARKS</p>
              <p className="text-sm text-foreground">{inspection.remarks}</p>
            </div>
          )}

          {/* Status change */}
          {canManage && (
            <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">CHANGE STATUS</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="gap-1.5">
                    {sc.label} <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {ALL_STATUSES.filter((s) => s !== inspection.status).map((s) => {
                    const cfg = INSPECTION_STATUS_CONFIG[s]
                    return (
                      <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                        <Badge className={cn('text-[10px] px-1.5 py-0 border-0 mr-2', cfg.cls)}>{cfg.label}</Badge>
                        {cfg.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-2">
              {canManage && (
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </Button>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
