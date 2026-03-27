'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, FolderKanban, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createInspection } from '../actions'
import { INSPECTION_TYPE_LABELS } from './InspectionRow'
import type { InspectionType } from '@/types/database'

type ProjectOption = { id: string; name: string; factory_id: string | null; factories: { name: string } | null }
type TemplateOption = { id: string; name: string; industry: string | null }

interface Props {
  open: boolean
  onClose: () => void
  projects: ProjectOption[]
  templates: TemplateOption[]
}

const INSPECTION_TYPES = Object.entries(INSPECTION_TYPE_LABELS) as [InspectionType, string][]

export function StartInspectionDialog({ open, onClose, projects, templates }: Props) {
  const [saving, setSaving] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [form, setForm] = useState({
    inspection_type: 'final' as InspectionType,
    inspection_date: new Date().toISOString().split('T')[0],
    auditor_name: '',
    aql_level: 'AQL 2.5',
    quantity_inspected: '',
    sample_size: '',
  })

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const eligibleProjects = projects.filter((p) => true) // show all projects
  const selectedProjectData = projects.find((p) => p.id === selectedProject)

  const handleSubmit = async () => {
    if (!selectedProject) { toast.error('Select a project'); return }
    if (!form.inspection_date) { toast.error('Inspection date is required'); return }

    const qty = parseInt(form.quantity_inspected) || 0
    const sample = parseInt(form.sample_size) || 0

    const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)

    setSaving(true)
    try {
      await createInspection({
        project_id: selectedProject,
        factory_id: selectedProjectData?.factory_id ?? null,
        inspection_type: form.inspection_type,
        inspection_date: form.inspection_date,
        auditor_name: form.auditor_name.trim(),
        aql_level: form.aql_level.trim() || 'AQL 2.5',
        quantity_inspected: qty,
        sample_size: sample,
        template_id: selectedTemplate || null,
        template_name: selectedTemplateData?.name ?? null,
        remarks: '',
      })
      toast.success('Inspection started')
      setSelectedProject('')
      setSelectedTemplate('')
      setForm({
        inspection_type: 'final',
        inspection_date: new Date().toISOString().split('T')[0],
        auditor_name: '',
        aql_level: 'AQL 2.5',
        quantity_inspected: '',
        sample_size: '',
      })
      onClose()
    } catch {
      toast.error('Failed to start inspection')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Inspection</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {/* Project selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <FolderKanban className="w-4 h-4 text-muted-foreground" />
              Select Project *
            </Label>
            <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
              {eligibleProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No projects found. Create a project first.</p>
              ) : (
                eligibleProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={cn(
                      'text-left px-3 py-2 rounded-lg border text-sm transition-all',
                      selectedProject === p.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                    onClick={() => setSelectedProject(p.id)}
                  >
                    <p className="font-medium truncate">{p.name}</p>
                    {p.factories?.name && (
                      <p className="text-xs text-muted-foreground">{p.factories.name}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Type + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Inspection Type</Label>
              <Select
                value={form.inspection_type}
                onValueChange={(v) => setForm((f) => ({ ...f, inspection_type: v as InspectionType }))}
                disabled={saving}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSPECTION_TYPES.map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Inspection Date *</Label>
              <Input type="date" value={form.inspection_date} onChange={set('inspection_date')} disabled={saving} />
            </div>
          </div>

          {/* Auditor + AQL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Auditor Name</Label>
              <Input placeholder="e.g. John Smith" value={form.auditor_name} onChange={set('auditor_name')} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>AQL Level</Label>
              <Input placeholder="AQL 2.5" value={form.aql_level} onChange={set('aql_level')} disabled={saving} />
            </div>
          </div>

          {/* Quantity + Sample */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Qty to Inspect</Label>
              <Input type="number" min={0} placeholder="0" value={form.quantity_inspected} onChange={set('quantity_inspected')} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label>Sample Size</Label>
              <Input type="number" min={0} placeholder="0" value={form.sample_size} onChange={set('sample_size')} disabled={saving} />
            </div>
          </div>

          {/* Template selection (optional) */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Template (optional)
              </Label>
              <div className="grid gap-2 max-h-32 overflow-y-auto pr-1">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn(
                      'text-left px-3 py-2 rounded-lg border text-sm transition-all',
                      selectedTemplate === t.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                    onClick={() => setSelectedTemplate(selectedTemplate === t.id ? '' : t.id)}
                  >
                    <p className="font-medium truncate">{t.name}</p>
                    {t.industry && <p className="text-xs text-muted-foreground">{t.industry}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" className="gap-1.5" disabled={saving || !selectedProject} onClick={handleSubmit}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Start Inspection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
