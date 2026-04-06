export type AuditRatingValue = 'G' | 'Y' | 'R' | 'NA'
export type AuditVerdict = 'passed' | 'conditional' | 'warning' | 'failed'
export type AuditV2Status = 'draft' | 'in_progress' | 'submitted' | 'reviewed' | 'closed'
export type AuditV2Type = 'initial' | 'follow_up' | 'annual' | 'special'
export type CARStatus = 'open' | 'in_progress' | 'resolved' | 'verified'

export interface AuditTemplate {
  id: string
  template_name: string
  standard: string
  version: number
  description: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface AuditTemplateSection {
  id: string
  template_id: string
  section_order: number
  section_name: string
  short_name: string | null
  max_points: number
  conditional_note: string | null
}

export interface AuditTemplateCheckpoint {
  id: string
  section_id: string
  item_number: number
  checkpoint_text: string
  is_conditional: boolean
  condition_group: string | null
}

export interface FactoryAuditV2 {
  id: string
  factory_id: string
  template_id: string
  audit_number: string
  audit_date: string
  audit_type: AuditV2Type
  auditor_name: string
  auditor_organization: string | null
  department: string | null
  plant_audited: string | null
  shift_audited: string | null
  attendees: string | null
  green_count: number
  yellow_count: number
  red_count: number
  na_count: number
  total_items: number
  applicable_items: number
  items_ok: number
  actions_required: number
  overall_score: number
  verdict: AuditVerdict | null
  status: AuditV2Status
  corrective_action_deadline: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  factories?: { name: string; city?: string; country?: string } | null
  audit_templates?: { template_name: string; standard: string } | null
}

export interface AuditRating {
  id: string
  audit_id: string
  checkpoint_id: string
  section_id: string | null
  item_number: number
  rating: AuditRatingValue | null
  notes: string | null
  corrective_action: string | null
  corrective_action_status: CARStatus
  corrective_action_deadline: string | null
  resolved_at: string | null
  rated_at: string
}

export const RATING_CONFIG: Record<AuditRatingValue, { label: string; color: string; bg: string }> = {
  G: { label: 'G', color: '#FFFFFF', bg: '#2E7D32' },
  Y: { label: 'Y', color: '#000000', bg: '#F59E0B' },
  R: { label: 'R', color: '#FFFFFF', bg: '#CC0000' },
  NA: { label: 'N/A', color: '#FFFFFF', bg: '#666666' },
}

export const VERDICT_CONFIG: Record<AuditVerdict, { label: string; color: string; bg: string; description: string }> = {
  passed: { label: 'PASSED', color: '#1B5E20', bg: '#C8E6C9', description: 'Factory approved for orders and sampling' },
  conditional: { label: 'CONDITIONAL', color: '#F57F17', bg: '#FFF8E1', description: 'Approved with corrective actions within 30 days' },
  warning: { label: 'WARNING', color: '#E65100', bg: '#FFF3E0', description: 'Hold orders until re-audit confirms improvement' },
  failed: { label: 'FAILED', color: '#CC0000', bg: '#FFEBEE', description: 'Re-audit required before any orders or sampling' },
}

export const AUDIT_V2_STATUS_CONFIG: Record<AuditV2Status, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#666', bg: '#f0f0f0' },
  in_progress: { label: 'In Progress', color: '#D4A843', bg: '#FFF8E1' },
  submitted: { label: 'Submitted', color: '#1565C0', bg: '#E3F2FD' },
  reviewed: { label: 'Reviewed', color: '#2E7D32', bg: '#E8F5E9' },
  closed: { label: 'Closed', color: '#1B5E20', bg: '#C8E6C9' },
}

export const AUDIT_V2_TYPE_CONFIG: Record<AuditV2Type, { label: string }> = {
  initial: { label: 'Initial' },
  follow_up: { label: 'Follow-up' },
  annual: { label: 'Annual' },
  special: { label: 'Special' },
}
