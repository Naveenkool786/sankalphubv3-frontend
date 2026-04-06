export type AuditType = 'social' | 'environmental' | 'quality_system' | 'security' | 'structural' | 'fire_safety'
export type AuditRating = 'A' | 'B' | 'C' | 'D' | 'F' | 'pass' | 'fail' | 'conditional'
export type AuditStatus = 'scheduled' | 'in_progress' | 'completed' | 'corrective_action_required' | 'corrective_action_submitted' | 'closed' | 'expired'
export type CertStatus = 'pending' | 'application_submitted' | 'testing_in_progress' | 'approved' | 'rejected' | 'expired' | 'renewal_due'
export type MilestoneStage = 'concept' | 'design_finalized' | 'sampling_approved' | 'production_confirmed' | 'photoshoot_ready' | 'listing_live' | 'retail_launch'
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'skipped'
export type ComplianceRegion = 'US' | 'EU' | 'UK' | 'global' | 'other'
export type ComplianceCategory = 'safety' | 'chemical' | 'labeling' | 'environmental' | 'social' | 'trade'

export interface ComplianceRequirement {
  id: string
  regulation_name: string
  regulation_code: string | null
  region: ComplianceRegion | null
  category: ComplianceCategory | null
  applicable_to: string[] | null
  description: string | null
  requirement_details: string | null
  testing_required: boolean
  certification_required: boolean
  penalty_info: string | null
  reference_url: string | null
  is_active: boolean
  created_at: string
}

export interface FactoryAudit {
  id: string
  factory_id: string
  audit_type: AuditType
  audit_standard: string | null
  auditor_name: string | null
  auditor_organization: string | null
  audit_date: string | null
  next_audit_date: string | null
  overall_rating: AuditRating | null
  score: number | null
  status: AuditStatus
  findings_count: number
  critical_findings: number
  major_findings: number
  minor_findings: number
  corrective_action_deadline: string | null
  report_url: string | null
  certificate_url: string | null
  certificate_expiry: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  factories?: { name: string } | null
}

export interface ProductCertification {
  id: string
  project_id: string | null
  production_order_id: string | null
  certification_name: string
  certification_body: string | null
  certificate_number: string | null
  status: CertStatus
  applied_date: string | null
  approved_date: string | null
  expiry_date: string | null
  scope: string | null
  certificate_url: string | null
  cost: number | null
  currency: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  projects?: { name: string } | null
}

export interface SustainabilityMetrics {
  id: string
  factory_id: string | null
  project_id: string | null
  metric_period: string | null
  water_usage_liters: number | null
  energy_usage_kwh: number | null
  renewable_energy_pct: number | null
  waste_generated_kg: number | null
  waste_recycled_pct: number | null
  carbon_emissions_kg: number | null
  total_workers: number | null
  female_workers_pct: number | null
  living_wage_compliance: boolean | null
  average_overtime_hours: number | null
  workplace_incidents: number | null
  sustainable_material_pct: number | null
  recycled_content_pct: number | null
  organic_content_pct: number | null
  esg_score: number | null
  notes: string | null
  created_by: string | null
  created_at: string
  factories?: { name: string } | null
}

export interface MarketingMilestone {
  id: string
  project_id: string
  production_order_id: string | null
  milestone_stage: MilestoneStage
  milestone_order: number
  planned_date: string | null
  actual_date: string | null
  status: MilestoneStatus
  assigned_to: string | null
  deliverables: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── Configs ───

export const AUDIT_TYPE_CONFIG: Record<AuditType, { label: string }> = {
  social: { label: 'Social' },
  environmental: { label: 'Environmental' },
  quality_system: { label: 'Quality System' },
  security: { label: 'Security' },
  structural: { label: 'Structural' },
  fire_safety: { label: 'Fire Safety' },
}

export const AUDIT_STATUS_CONFIG: Record<AuditStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: '#1565C0', bg: '#E3F2FD' },
  in_progress: { label: 'In Progress', color: '#D4A843', bg: '#FFF8E1' },
  completed: { label: 'Completed', color: '#2E7D32', bg: '#E8F5E9' },
  corrective_action_required: { label: 'CAR Required', color: '#CC0000', bg: '#FFEBEE' },
  corrective_action_submitted: { label: 'CAR Submitted', color: '#E65100', bg: '#FFF3E0' },
  closed: { label: 'Closed', color: '#1B5E20', bg: '#C8E6C9' },
  expired: { label: 'Expired', color: '#9E9E9E', bg: '#f0f0f0' },
}

export const RATING_CONFIG: Record<AuditRating, { label: string; color: string }> = {
  A: { label: 'A', color: '#1B5E20' },
  B: { label: 'B', color: '#2E7D32' },
  C: { label: 'C', color: '#D4A843' },
  D: { label: 'D', color: '#E65100' },
  F: { label: 'F', color: '#CC0000' },
  pass: { label: 'Pass', color: '#2E7D32' },
  fail: { label: 'Fail', color: '#CC0000' },
  conditional: { label: 'Conditional', color: '#E65100' },
}

export const CERT_STATUS_CONFIG: Record<CertStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#666', bg: '#f0f0f0' },
  application_submitted: { label: 'Submitted', color: '#1565C0', bg: '#E3F2FD' },
  testing_in_progress: { label: 'Testing', color: '#D4A843', bg: '#FFF8E1' },
  approved: { label: 'Approved', color: '#2E7D32', bg: '#E8F5E9' },
  rejected: { label: 'Rejected', color: '#CC0000', bg: '#FFEBEE' },
  expired: { label: 'Expired', color: '#8B0000', bg: '#FFCDD2' },
  renewal_due: { label: 'Renewal Due', color: '#E65100', bg: '#FFF3E0' },
}

export const MILESTONE_STAGE_CONFIG: Record<MilestoneStage, { label: string; order: number }> = {
  concept: { label: 'Concept', order: 1 },
  design_finalized: { label: 'Design Finalized', order: 2 },
  sampling_approved: { label: 'Sampling Approved', order: 3 },
  production_confirmed: { label: 'Production Confirmed', order: 4 },
  photoshoot_ready: { label: 'Photoshoot Ready', order: 5 },
  listing_live: { label: 'Listing Live', order: 6 },
  retail_launch: { label: 'Retail Launch', order: 7 },
}

export const REGION_CONFIG: Record<ComplianceRegion, { label: string; flag: string }> = {
  US: { label: 'United States', flag: '🇺🇸' },
  EU: { label: 'European Union', flag: '🇪🇺' },
  UK: { label: 'United Kingdom', flag: '🇬🇧' },
  global: { label: 'Global', flag: '🌐' },
  other: { label: 'Other', flag: '📋' },
}

export const CATEGORY_CONFIG: Record<ComplianceCategory, { label: string; color: string }> = {
  safety: { label: 'Safety', color: '#CC0000' },
  chemical: { label: 'Chemical', color: '#7B1FA2' },
  labeling: { label: 'Labeling', color: '#1565C0' },
  environmental: { label: 'Environmental', color: '#2E7D32' },
  social: { label: 'Social', color: '#E65100' },
  trade: { label: 'Trade', color: '#4E342E' },
}

export const MARKETING_STAGES = [
  { stage: 'concept' as MilestoneStage, order: 1, deliverables: 'Mood board, initial sketches, target customer profile' },
  { stage: 'design_finalized' as MilestoneStage, order: 2, deliverables: 'Tech pack complete, BOM finalized, colorways confirmed' },
  { stage: 'sampling_approved' as MilestoneStage, order: 3, deliverables: 'PP sample approved, size grading done, fit comments closed' },
  { stage: 'production_confirmed' as MilestoneStage, order: 4, deliverables: 'PO issued, production schedule locked, bulk fabric in-house' },
  { stage: 'photoshoot_ready' as MilestoneStage, order: 5, deliverables: 'Shipment samples ready, lookbook shot list, model booked' },
  { stage: 'listing_live' as MilestoneStage, order: 6, deliverables: 'Product page live, SEO optimized, inventory synced' },
  { stage: 'retail_launch' as MilestoneStage, order: 7, deliverables: 'Available for purchase, marketing campaign active, PR sent' },
]

export function calculateESGScore(m: Partial<SustainabilityMetrics>): number {
  let score = 0
  const renew = m.renewable_energy_pct ?? 0
  const waste = m.waste_recycled_pct ?? 0
  const carbon = m.carbon_emissions_kg ?? 0
  const living = m.living_wage_compliance ?? false
  const overtime = m.average_overtime_hours ?? 0
  const incidents = m.workplace_incidents ?? 0
  const sustMat = m.sustainable_material_pct ?? 0
  const recycled = m.recycled_content_pct ?? 0
  const organic = m.organic_content_pct ?? 0

  // Environmental (40%)
  score += renew >= 50 ? 15 : (renew / 50) * 15
  score += waste >= 80 ? 15 : (waste / 80) * 15
  score += Math.min(10, (100 - (carbon / 1000)) * 0.1)
  // Social (30%)
  if (living) score += 15
  score += overtime <= 10 ? 10 : Math.max(0, 10 - (overtime - 10))
  if (incidents === 0) score += 5
  // Materials (30%)
  score += (sustMat / 100) * 15
  score += (recycled / 100) * 10
  score += (organic / 100) * 5

  return Math.min(100, Math.round(score))
}

export function getExpiryStatus(expiryDate: string | null): { label: string; color: string; bg: string } {
  if (!expiryDate) return { label: 'N/A', color: '#666', bg: '#f0f0f0' }
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: 'Expired', color: '#8B0000', bg: '#FFCDD2' }
  if (days < 30) return { label: 'Expiring Soon', color: '#CC0000', bg: '#FFEBEE' }
  if (days < 60) return { label: 'Renewal Due', color: '#E65100', bg: '#FFF3E0' }
  return { label: 'Valid', color: '#2E7D32', bg: '#E8F5E9' }
}
