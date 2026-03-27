'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FIELD_TYPE_OPTIONS, getFieldIcon, type FieldType } from './template-helpers'
import type { FieldData } from '../actions'

interface Props {
  field: FieldData
  onChange: (updated: FieldData) => void
  onClose: () => void
}

export function FieldEditorPanel({ field, onChange, onClose }: Props) {
  const [newOption, setNewOption] = useState('')
  const Icon = getFieldIcon(field.type)

  function addOption() {
    const trimmed = newOption.trim()
    if (!trimmed || field.options.includes(trimmed)) return
    onChange({ ...field, options: [...field.options, trimmed] })
    setNewOption('')
  }

  function removeOption(opt: string) {
    onChange({ ...field, options: field.options.filter((o) => o !== opt) })
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Edit Field</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Label */}
      <div>
        <Label className="text-xs">Label</Label>
        <Input
          className="h-8 mt-1 text-sm"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
        />
      </div>

      {/* Placeholder */}
      <div>
        <Label className="text-xs">Placeholder</Label>
        <Input
          className="h-8 mt-1 text-sm"
          value={field.placeholder}
          onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
          placeholder="Placeholder text..."
        />
      </div>

      {/* Type selector */}
      <div>
        <Label className="text-xs">Field Type</Label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {FIELD_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() =>
                onChange({
                  ...field,
                  type: opt.type,
                  options: opt.type === 'dropdown' && field.options.length === 0 ? ['Pass', 'Fail'] : field.options,
                  scorable: ['dropdown', 'yes_no', 'scale', 'number'].includes(opt.type) ? field.scorable : false,
                })
              }
              className={cn(
                'px-2 py-1 rounded-md text-[10px] font-medium border transition-all',
                field.type === opt.type
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown options */}
      {field.type === 'dropdown' && (
        <div>
          <Label className="text-xs">Options</Label>
          <div className="space-y-1.5 mt-1.5">
            {field.options.map((opt) => (
              <div key={opt} className="flex items-center gap-1.5">
                <Badge className="text-xs bg-muted text-muted-foreground flex-1 justify-start border-0">
                  {opt}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-red-500"
                  onClick={() => removeOption(opt)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <Input
                className="h-7 text-xs flex-1"
                placeholder="Add option..."
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addOption()}
              />
              <Button size="sm" className="h-7 text-xs px-2" onClick={addOption}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Required</Label>
          <Switch
            checked={field.required}
            onCheckedChange={(v) => onChange({ ...field, required: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Scorable</Label>
          <Switch
            checked={field.scorable}
            onCheckedChange={(v) => onChange({ ...field, scorable: v })}
            disabled={!['dropdown', 'yes_no', 'scale', 'number'].includes(field.type)}
          />
        </div>
      </div>

      {/* Weight */}
      {field.scorable && (
        <div>
          <Label className="text-xs">Score Weight</Label>
          <Input
            type="number"
            min={1}
            max={10}
            className="h-8 mt-1 text-sm w-24"
            value={field.weight}
            onChange={(e) =>
              onChange({ ...field, weight: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
          />
        </div>
      )}
    </div>
  )
}
