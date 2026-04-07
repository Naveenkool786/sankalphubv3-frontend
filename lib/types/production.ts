export type ProductionCategory = 'woven' | 'knits' | 'denim' | 'outerwear' | 'accessories'

export type ProductionStatus =
  | 'planning' | 'fabric_sourcing' | 'fabric_in_house' | 'cutting'
  | 'sewing' | 'washing' | 'finishing' | 'packing'
  | 'ready_to_ship' | 'shipped' | 'cancelled'

export type ProductionPriority = 'low' | 'normal' | 'high' | 'urgent'

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'skipped'

export type DelayType =
  | 'fabric_delay' | 'trim_delay' | 'machine_breakdown' | 'labor_shortage'
  | 'quality_issue' | 'approval_pending' | 'power_outage' | 'other'

export type DelaySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ProductionOrder {
  id: string
  project_id: string
  order_number: string
  style_id: string | null
  style_number: string | null
  style_name: string | null
  category: ProductionCategory | null
  factory_id: string | null
  buyer_brand: string | null
  season: string | null
  total_quantity: number
  unit: string
  status: ProductionStatus
  priority: ProductionPriority
  planned_start_date: string | null
  planned_end_date: string | null
  actual_start_date: string | null
  actual_end_date: string | null
  ex_factory_date: string | null
  revised_ex_factory_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  factories?: { name: string } | null
  projects?: { name: string } | null
}

export interface ProductionMilestone {
  id: string
  production_order_id: string
  milestone_name: string
  milestone_order: number
  planned_start: string | null
  planned_end: string | null
  actual_start: string | null
  actual_end: string | null
  status: MilestoneStatus
  completion_percentage: number
  delay_days: number
  delay_reason: string | null
  notes: string | null
}

export interface ProductionDailyLog {
  id: string
  production_order_id: string
  log_date: string
  milestone_name: string | null
  planned_qty: number
  actual_qty: number
  cumulative_qty: number
  efficiency_percentage: number | null
  defect_qty: number
  rework_qty: number
  operator_count: number | null
  machine_count: number | null
  remarks: string | null
}

export interface ProductionDelay {
  id: string
  production_order_id: string
  milestone_name: string | null
  delay_type: DelayType
  severity: DelaySeverity
  delay_days: number
  description: string | null
  resolution: string | null
  resolved_at: string | null
  reported_by: string | null
  created_at: string
}

export const STATUS_CONFIG: Record<ProductionStatus, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planning', color: '#666', bg: '#f0f0f0' },
  fabric_sourcing: { label: 'Fabric Sourcing', color: '#1565C0', bg: '#E3F2FD' },
  fabric_in_house: { label: 'Fabric In-House', color: '#1565C0', bg: '#E3F2FD' },
  cutting: { label: 'Cutting', color: '#D4A843', bg: '#FFF8E1' },
  sewing: { label: 'Sewing', color: '#D4A843', bg: '#FFF8E1' },
  washing: { label: 'Washing', color: '#7B1FA2', bg: '#F3E5F5' },
  finishing: { label: 'Finishing', color: '#7B1FA2', bg: '#F3E5F5' },
  packing: { label: 'Packing', color: '#2E7D32', bg: '#E8F5E9' },
  ready_to_ship: { label: 'Ready to Ship', color: '#1B5E20', bg: '#C8E6C9' },
  shipped: { label: 'Shipped', color: '#1B5E20', bg: '#C8E6C9' },
  cancelled: { label: 'Cancelled', color: '#CC0000', bg: '#FFEBEE' },
}

export const PRIORITY_CONFIG: Record<ProductionPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: '#666', bg: '#f0f0f0' },
  normal: { label: 'Normal', color: '#1565C0', bg: '#E3F2FD' },
  high: { label: 'High', color: '#E65100', bg: '#FFF3E0' },
  urgent: { label: 'Urgent', color: '#CC0000', bg: '#FFEBEE' },
}

export const DEFAULT_MILESTONES: Record<ProductionCategory, { name: string; order: number; defaultDays: number }[]> = {
  woven: [
    { name: 'Fabric Sourcing', order: 1, defaultDays: 14 },
    { name: 'Fabric In-House & Inspection', order: 2, defaultDays: 3 },
    { name: 'Cutting', order: 3, defaultDays: 5 },
    { name: 'Sewing', order: 4, defaultDays: 15 },
    { name: 'Finishing & Pressing', order: 5, defaultDays: 3 },
    { name: 'Final Inspection', order: 6, defaultDays: 2 },
    { name: 'Packing', order: 7, defaultDays: 3 },
  ],
  knits: [
    { name: 'Yarn Sourcing', order: 1, defaultDays: 10 },
    { name: 'Knitting', order: 2, defaultDays: 10 },
    { name: 'Dyeing & Processing', order: 3, defaultDays: 7 },
    { name: 'Cutting', order: 4, defaultDays: 4 },
    { name: 'Sewing', order: 5, defaultDays: 12 },
    { name: 'Finishing', order: 6, defaultDays: 3 },
    { name: 'Final Inspection', order: 7, defaultDays: 2 },
    { name: 'Packing', order: 8, defaultDays: 3 },
  ],
  denim: [
    { name: 'Fabric Sourcing', order: 1, defaultDays: 14 },
    { name: 'Fabric In-House & Inspection', order: 2, defaultDays: 3 },
    { name: 'Cutting', order: 3, defaultDays: 5 },
    { name: 'Sewing', order: 4, defaultDays: 15 },
    { name: 'Washing & Finishing', order: 5, defaultDays: 7 },
    { name: 'Final Inspection', order: 6, defaultDays: 2 },
    { name: 'Packing', order: 7, defaultDays: 3 },
  ],
  outerwear: [
    { name: 'Shell & Lining Sourcing', order: 1, defaultDays: 18 },
    { name: 'Fabric In-House & Inspection', order: 2, defaultDays: 3 },
    { name: 'Cutting', order: 3, defaultDays: 5 },
    { name: 'Sewing & Assembly', order: 4, defaultDays: 20 },
    { name: 'Finishing & QC', order: 5, defaultDays: 4 },
    { name: 'Final Inspection', order: 6, defaultDays: 2 },
    { name: 'Packing', order: 7, defaultDays: 3 },
  ],
  accessories: [
    { name: 'Material Sourcing', order: 1, defaultDays: 10 },
    { name: 'Component Assembly', order: 2, defaultDays: 8 },
    { name: 'Finishing', order: 3, defaultDays: 4 },
    { name: 'Quality Check', order: 4, defaultDays: 2 },
    { name: 'Packing', order: 5, defaultDays: 3 },
  ],
}
