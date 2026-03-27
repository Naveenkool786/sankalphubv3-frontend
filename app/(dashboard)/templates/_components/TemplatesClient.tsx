'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus, ChevronDown, ChevronRight, Trash2, GripVertical,
  FileText, Copy, Zap, Save, Archive, Type,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { FIELD_TYPE_OPTIONS, TEMPLATE_TYPE_STYLES, getFieldIcon, generateLocalId } from './template-helpers'
import { CreateTemplateDialog } from './CreateTemplateDialog'
import { FieldEditorPanel } from './FieldEditorPanel'
import { updateTemplate, duplicateTemplate, archiveTemplate } from '../actions'
import type { FieldData, SectionData } from '../actions'

export type TemplateRow = {
  id: string
  name: string
  template_type: string
  industry: string | null
  sections: SectionData[]
  score_formula: string | null
  is_archived: boolean
  created_at: string
}

interface Props {
  templates: TemplateRow[]
  canManage: boolean
}

export function TemplatesClient({ templates, canManage }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null)
  const [localName, setLocalName] = useState<string>('')
  const [localFormula, setLocalFormula] = useState<string>('')
  const [localSections, setLocalSections] = useState<SectionData[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [addToSectionId, setAddToSectionId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null

  function selectTemplate(id: string) {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setSelectedId(id)
    setLocalName(t.name)
    setLocalFormula(t.score_formula ?? '')
    setLocalSections(t.sections)
    setDirty(false)
    setSelectedFieldId(null)
    setExpandedSections(t.sections.length > 0 ? new Set([t.sections[0].id]) : new Set())
  }

  // Auto-load first template on first render
  useState(() => {
    if (templates.length > 0) selectTemplate(templates[0].id)
  })

  const markDirty = useCallback(() => setDirty(true), [])

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addSection() {
    const newId = generateLocalId('s')
    const newSection: SectionData = { id: newId, title: 'New Section', fields: [] }
    setLocalSections((prev) => [...prev, newSection])
    setExpandedSections((p) => new Set([...p, newId]))
    markDirty()
  }

  function removeSection(sectionId: string) {
    setLocalSections((prev) => prev.filter((s) => s.id !== sectionId))
    markDirty()
  }

  function updateSectionTitle(sectionId: string, title: string) {
    setLocalSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, title } : s))
    markDirty()
  }

  function addField(sectionId: string, type: FieldData['type']) {
    const fieldLabel = FIELD_TYPE_OPTIONS.find((f) => f.type === type)?.label ?? 'New Field'
    const newField: FieldData = {
      id: generateLocalId('f'),
      label: fieldLabel,
      type,
      required: false,
      scorable: ['dropdown', 'yes_no', 'scale', 'number'].includes(type),
      weight: 1,
      options: type === 'dropdown' ? ['Pass', 'Fail'] : [],
      placeholder: '',
    }
    setLocalSections((prev) =>
      prev.map((s) => s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s)
    )
    setSelectedFieldId(newField.id)
    setAddFieldOpen(false)
    markDirty()
  }

  function removeField(sectionId: string, fieldId: string) {
    setLocalSections((prev) =>
      prev.map((s) => s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s)
    )
    if (selectedFieldId === fieldId) setSelectedFieldId(null)
    markDirty()
  }

  function updateField(sectionId: string, updated: FieldData) {
    setLocalSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, fields: s.fields.map((f) => f.id === updated.id ? updated : f) } : s
      )
    )
    markDirty()
  }

  function findFieldContext(): { section: SectionData; field: FieldData } | null {
    if (!selectedFieldId) return null
    for (const section of localSections) {
      const field = section.fields.find((f) => f.id === selectedFieldId)
      if (field) return { section, field }
    }
    return null
  }

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    try {
      await updateTemplate(selectedId, {
        name: localName,
        score_formula: localFormula,
        sections: localSections,
      })
      setDirty(false)
      toast.success('Template saved')
    } catch {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicate() {
    if (!selectedId) return
    try {
      await duplicateTemplate(selectedId)
      toast.success('Template duplicated')
    } catch {
      toast.error('Failed to duplicate')
    }
  }

  async function handleArchive() {
    if (!selectedId) return
    if (!confirm('Archive this template? It will no longer appear in new inspections.')) return
    try {
      await archiveTemplate(selectedId)
      toast.success('Template archived')
      setSelectedId(null)
      setDirty(false)
    } catch {
      toast.error('Failed to archive')
    }
  }

  const fieldContext = findFieldContext()
  const fieldCount = localSections.reduce((acc, s) => acc + s.fields.length, 0)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build reusable inspection &amp; workflow templates
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Template
          </Button>
        )}
      </div>

      {/* Empty state */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">No templates yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first template to standardize quality inspections.
          </p>
          {canManage && (
            <Button size="sm" className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          {/* Template list sidebar */}
          <div className="space-y-2">
            {templates.map((t) => (
              <Card
                key={t.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-sm',
                  selectedId === t.id ? 'ring-2 ring-primary shadow-sm' : ''
                )}
                onClick={() => selectTemplate(t.id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge className={cn('text-[9px] px-1 py-0 border-0', TEMPLATE_TYPE_STYLES[t.template_type] ?? '')}>
                          {t.template_type}
                        </Badge>
                        {t.industry && (
                          <span className="text-[10px] text-muted-foreground">{t.industry}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {t.sections.length} sections · {t.sections.reduce((a, s) => a + s.fields.length, 0)} fields
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Editor panel */}
          {selectedTemplate && (
            <Card className="h-fit">
              <CardContent className="pt-5 space-y-5">
                {/* Template header */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {canManage ? (
                      <Input
                        value={localName}
                        onChange={(e) => { setLocalName(e.target.value); markDirty() }}
                        className="text-base font-semibold h-10 border-0 border-b rounded-none px-0 focus-visible:ring-0 bg-transparent"
                      />
                    ) : (
                      <h2 className="text-base font-semibold">{localName}</h2>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedTemplate.industry} · {localSections.length} sections · {fieldCount} fields
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" className="gap-1.5 text-xs h-8" onClick={handleDuplicate}>
                        <Copy className="w-3.5 h-3.5" /> Duplicate
                      </Button>
                      <Button
                        variant="secondary" size="sm"
                        className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
                        onClick={handleArchive}
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </Button>
                      <Button
                        size="sm" className="gap-1.5 text-xs h-8"
                        onClick={handleSave}
                        disabled={!dirty || saving}
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? 'Saving...' : dirty ? 'Save' : 'Saved'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Score Formula */}
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">
                      Score Formula
                    </p>
                    {canManage ? (
                      <Input
                        value={localFormula}
                        onChange={(e) => { setLocalFormula(e.target.value); markDirty() }}
                        placeholder="e.g. 100 - critical*10 - major*5 - minor*2"
                        className="h-7 text-xs font-mono bg-transparent border-0 px-0 focus-visible:ring-0"
                      />
                    ) : (
                      <code className="text-xs font-mono text-foreground">{localFormula || '—'}</code>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Sections + field editor */}
                <div className="grid lg:grid-cols-[1fr_280px] gap-4">
                  {/* Sections */}
                  <div className="space-y-3">
                    {localSections.map((section, si) => (
                      <div key={section.id} className="border border-border rounded-xl overflow-hidden">
                        {/* Section header */}
                        <div
                          className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleSection(section.id)}
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs font-bold text-muted-foreground w-5 h-5 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            {si + 1}
                          </span>
                          {canManage ? (
                            <Input
                              value={section.title}
                              onChange={(e) => { e.stopPropagation(); updateSectionTitle(section.id, e.target.value) }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 text-sm font-semibold border-0 px-0 bg-transparent focus-visible:ring-0 flex-1"
                            />
                          ) : (
                            <span className="text-sm font-semibold flex-1">{section.title}</span>
                          )}
                          <span className="text-xs text-muted-foreground">{section.fields.length} fields</span>
                          {canManage && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-red-500"
                              onClick={(e) => { e.stopPropagation(); removeSection(section.id) }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {expandedSections.has(section.id)
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>

                        {/* Fields */}
                        {expandedSections.has(section.id) && (
                          <div className="divide-y divide-border">
                            {section.fields.map((field) => {
                              const FieldIcon = getFieldIcon(field.type)
                              return (
                                <div
                                  key={field.id}
                                  className={cn(
                                    'flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer',
                                    selectedFieldId === field.id && 'bg-primary/5'
                                  )}
                                  onClick={() => setSelectedFieldId(selectedFieldId === field.id ? null : field.id)}
                                >
                                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  <FieldIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm flex-1 truncate">{field.label}</span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {field.required && (
                                      <span className="text-[9px] font-semibold text-red-500">REQ</span>
                                    )}
                                    {field.scorable && (
                                      <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                        ×{field.weight}
                                      </span>
                                    )}
                                    <Badge className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground capitalize border-0">
                                      {field.type.replace('_', '/')}
                                    </Badge>
                                    {canManage && (
                                      <Button
                                        variant="ghost" size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                        onClick={(e) => { e.stopPropagation(); removeField(section.id, field.id) }}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                            {canManage && (
                              <div className="px-4 py-2">
                                <Button
                                  variant="ghost" size="sm"
                                  className="gap-1.5 text-xs h-7 text-primary hover:text-primary"
                                  onClick={() => { setAddToSectionId(section.id); setAddFieldOpen(true) }}
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Field
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {canManage && (
                      <Button variant="secondary" size="sm" className="gap-2 w-full text-xs" onClick={addSection}>
                        <Plus className="w-3.5 h-3.5" /> Add Section
                      </Button>
                    )}
                  </div>

                  {/* Field editor panel */}
                  <div>
                    {fieldContext && canManage ? (
                      <FieldEditorPanel
                        key={fieldContext.field.id}
                        field={fieldContext.field}
                        onChange={(updated) => updateField(fieldContext.section.id, updated)}
                        onClose={() => setSelectedFieldId(null)}
                      />
                    ) : (
                      <div className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center h-48">
                        <Type className="w-6 h-6 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">
                          {canManage ? 'Click a field to edit its properties' : 'Select a field to view its details'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Field Dialog */}
      <Dialog open={addFieldOpen} onOpenChange={setAddFieldOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Choose Field Type</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {FIELD_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.type}
                  onClick={() => addToSectionId && addField(addToSectionId, opt.type)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:bg-accent hover:border-primary/30 transition-all text-left"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAddFieldOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <CreateTemplateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
