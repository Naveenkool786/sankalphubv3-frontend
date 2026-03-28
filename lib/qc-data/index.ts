export type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'COSMETIC'

export type CategoryId =
  | 'mens_outerwear'
  | 'womens_outerwear'
  | 'footwear'
  | 'gloves'
  | 'headwear'
  | 'accessories'

export interface StageCheck {
  active: boolean
  check: string
  action: string
  tools_required?: string[]
  pass_criteria?: string
}

export interface Defect {
  id: string
  code: string
  name: string
  type: string
  severity: Severity
  applies_to: CategoryId[]
  products_affected?: string[]
  description?: string
  corrective_action?: string
  stage_checks: Record<string, StageCheck>
}

interface DefectsData {
  defects: Defect[]
}

import defectsData from './master-defects.json'

const defects = (defectsData as unknown as DefectsData).defects

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  mens_outerwear: "Men's Outerwear",
  womens_outerwear: "Women's Outerwear",
  footwear: 'Footwear',
  gloves: 'Gloves',
  headwear: 'Headwear',
  accessories: 'Accessories',
}

export const CATEGORY_IDS = Object.keys(CATEGORY_LABELS) as CategoryId[]

export const SEVERITY_CONFIG: Record<Severity, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  aql: string
  action: string
}> = {
  CRITICAL: {
    label: 'Critical',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-900/40',
    aql: '0.0 (Zero Tolerance)',
    action: 'HALT — Do not ship',
  },
  MAJOR: {
    label: 'Major',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-900/40',
    aql: 'AQL 2.5',
    action: 'Rework or reject lot',
  },
  MINOR: {
    label: 'Minor',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-900/40',
    aql: 'AQL 4.0',
    action: 'Conditional accept',
  },
  COSMETIC: {
    label: 'Cosmetic',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    aql: 'AQL 4.0',
    action: 'Note on report',
  },
}

export function getAllDefects(): Defect[] {
  return defects
}

export function getDefectsByCategory(categoryId: CategoryId): Defect[] {
  return defects.filter(d => d.applies_to?.includes(categoryId))
}

export function getDefectsBySeverity(severity: Severity): Defect[] {
  return defects.filter(d => d.severity === severity)
}

export function getDefectById(code: string): Defect | null {
  return defects.find(d => d.code === code) || null
}
