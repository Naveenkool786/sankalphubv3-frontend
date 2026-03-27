import type { LucideIcon } from 'lucide-react'
import { Type, Hash, List, ToggleLeft, Star, Upload, AlignLeft } from 'lucide-react'
import type { FieldType } from '../actions'

export type { FieldType }

export interface FieldTypeOption {
  type: FieldType
  label: string
  icon: LucideIcon
  desc: string
}

export const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  { type: 'text',     label: 'Text',        icon: Type,       desc: 'Single line text input' },
  { type: 'number',   label: 'Number',      icon: Hash,       desc: 'Numeric value' },
  { type: 'dropdown', label: 'Dropdown',    icon: List,       desc: 'Select from options' },
  { type: 'yes_no',   label: 'Yes / No',    icon: ToggleLeft, desc: 'Boolean pass/fail' },
  { type: 'scale',    label: 'Scale (1-5)', icon: Star,       desc: 'Rating scale' },
  { type: 'image',    label: 'Image Upload',icon: Upload,     desc: 'Photo evidence' },
  { type: 'textarea', label: 'Text Area',   icon: AlignLeft,  desc: 'Multi-line notes' },
]

export const TEMPLATE_TYPE_STYLES: Record<string, string> = {
  inspection: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  report:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  workflow:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export function getFieldIcon(type: FieldType): LucideIcon {
  return FIELD_TYPE_OPTIONS.find((f) => f.type === type)?.icon ?? Type
}

export function generateLocalId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
