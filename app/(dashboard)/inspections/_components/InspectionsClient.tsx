'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InspectionRow, INSPECTION_STATUS_CONFIG, type InspectionRow as InspectionRowType } from './InspectionRow'
import { InspectionDetailDialog } from './InspectionDetailDialog'
import type { InspectionStatus } from '@/types/database'

type ProjectOption = { id: string; name: string; factory_id: string | null; factories: { name: string } | null }
type TemplateOption = { id: string; name: string; industry: string | null }

const STATUS_TABS: (InspectionStatus | 'all')[] = [
  'all', 'draft', 'scheduled', 'confirmed', 'in_progress', 'report_pending', 'submitted', 'approved', 'cancelled',
]

interface Props {
  inspections: InspectionRowType[]
  projects: ProjectOption[]
  templates: TemplateOption[]
  canManage: boolean
}

export function InspectionsClient({ inspections, projects, templates, canManage }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<InspectionStatus | 'all'>('all')
  const [selectedInspection, setSelectedInspection] = useState<InspectionRowType | null>(null)

  const filtered = useMemo(() => {
    let list = inspections
    if (activeTab !== 'all') list = list.filter((i) => i.status === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          (i.projects?.name ?? '').toLowerCase().includes(q) ||
          (i.factories?.name ?? '').toLowerCase().includes(q) ||
          (i.auditor_name ?? '').toLowerCase().includes(q) ||
          (i.template_name ?? '').toLowerCase().includes(q) ||
          i.inspection_no.toLowerCase().includes(q)
      )
    }
    return list
  }, [inspections, activeTab, search])

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inspections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => router.push('/inspections/new')}>
          <Plus className="w-4 h-4" /> New Inspection
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 h-9 text-sm"
          placeholder="Search inspections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {STATUS_TABS.map((tab) => {
          const label = tab === 'all'
            ? `All (${inspections.length})`
            : INSPECTION_STATUS_CONFIG[tab].label
          return (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'secondary'}
              size="sm"
              className={cn('h-8 text-xs')}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </Button>
          )
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">
            {search
              ? 'No matching inspections'
              : activeTab !== 'all'
                ? `No ${INSPECTION_STATUS_CONFIG[activeTab].label.toLowerCase()} inspections`
                : 'No inspections yet'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search
              ? 'Try a different search term.'
              : 'Start your first inspection to begin tracking quality.'}
          </p>
          {!search && (
            <Button size="sm" className="mt-4 gap-2" onClick={() => router.push('/inspections/new')}>
              <Plus className="w-4 h-4" /> Start Inspection
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insp) => (
            <InspectionRow
              key={insp.id}
              inspection={insp}
              onClick={setSelectedInspection}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <InspectionDetailDialog
        inspection={selectedInspection}
        open={!!selectedInspection}
        onClose={() => setSelectedInspection(null)}
        canManage={canManage}
      />
    </>
  )
}
