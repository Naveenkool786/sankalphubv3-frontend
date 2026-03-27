'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createTemplate } from '../actions'
import { TEMPLATE_TYPE_STYLES } from './template-helpers'

const TEMPLATE_TYPES = [
  { value: 'inspection', label: 'Inspection' },
  { value: 'report',     label: 'Report' },
  { value: 'workflow',   label: 'Workflow' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateTemplateDialog({ open, onClose }: Props) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [templateType, setTemplateType] = useState('inspection')
  const [industry, setIndustry] = useState('')

  const reset = () => { setName(''); setTemplateType('inspection'); setIndustry('') }

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Template name is required'); return }
    if (!industry.trim()) { toast.error('Industry is required'); return }

    setSaving(true)
    try {
      await createTemplate({ name: name.trim(), template_type: templateType, industry: industry.trim() })
      toast.success('Template created')
      reset()
      onClose()
    } catch {
      toast.error('Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div>
            <Label className="text-xs">Template Name *</Label>
            <Input
              className="h-9 mt-1"
              placeholder="e.g. Footwear Inspection Standard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <Label className="text-xs">Type *</Label>
            <div className="flex gap-2 mt-1.5">
              {TEMPLATE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTemplateType(t.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                    templateType === t.value
                      ? cn('border-primary', TEMPLATE_TYPE_STYLES[t.value])
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Industry *</Label>
            <Input
              className="h-9 mt-1"
              placeholder="e.g. Footwear, Apparel, General"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
