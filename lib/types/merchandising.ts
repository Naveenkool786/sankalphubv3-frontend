export type SeasonType = 'spring_summer' | 'fall_winter' | 'resort' | 'pre_fall' | 'capsule'
export type SeasonStatus = 'planning' | 'development' | 'selling' | 'production' | 'delivered' | 'archived'
export type LifecycleStage = 'concept' | 'design' | 'tech_pack' | 'sampling' | 'costing' | 'approved' | 'in_production' | 'delivered' | 'discontinued'
export type StyleStatus = 'active' | 'on_hold' | 'dropped' | 'archived'
export type LinePlanPriority = 'must_have' | 'normal' | 'nice_to_have' | 'carryover'
export type TechPackStatus = 'draft' | 'review' | 'approved' | 'revised'
export type LabDipStatus = 'not_started' | 'submitted' | 'approved' | 'rejected' | 'resubmit'
export type OrderBookingStatus = 'booked' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled'

export interface Season {
  id: string; season_code: string; season_name: string; year: number
  season_type: SeasonType | null; status: SeasonStatus
  start_date: string | null; end_date: string | null
  target_styles: number; target_units: number; target_revenue: number
  currency: string; notes: string | null
  created_at: string; updated_at: string
}

export interface Style {
  id: string; style_number: string; style_name: string
  season_id: string | null; project_id: string | null
  category: string | null; sub_category: string | null
  gender: string | null; description: string | null
  wholesale_price: number | null; retail_price: number | null
  target_fob: number | null; actual_fob: number | null; currency: string
  fabric_composition: string | null; weight_gsm: number | null
  construction: string | null; silhouette: string | null
  lifecycle_stage: LifecycleStage; status: StyleStatus
  factory_id: string | null; buyer_brand: string | null
  thumbnail_url: string | null; is_carryover: boolean
  created_at: string; updated_at: string
  seasons?: { season_code: string; season_name: string } | null
  factories?: { name: string } | null
}

export interface Colorway {
  id: string; style_id: string
  color_code: string; color_name: string
  hex_value: string | null; pantone_code: string | null
  fabric_ref: string | null; status: string; lab_dip_status: LabDipStatus | null
  sort_order: number; notes: string | null
}

export interface TechPack {
  id: string; style_id: string; version: number; status: TechPackStatus
  garment_description: string | null; fit_type: string | null
  design_details: string | null; stitching_details: string | null
  label_placement: string | null; packaging_instructions: string | null
  wash_care_instructions: string | null; grading_rule: string | null
  base_size: string | null; notes: string | null
  created_at: string
}

export interface TechPackMeasurement {
  id: string; tech_pack_id: string
  pom_code: string; description: string; unit: string
  tolerance_plus: number; tolerance_minus: number
  size_specs: Record<string, string>; sort_order: number
}

export interface StyleBOM {
  id: string; style_id: string; item_order: number
  bom_category: string; description: string
  supplier: string | null; supplier_ref: string | null
  color: string | null; placement: string | null
  consumption_per_unit: number | null; unit: string
  unit_price: number | null; wastage_pct: number
  total_cost_per_unit: number | null; currency: string
  lead_time_days: number | null; status: string
}

export interface OrderBooking {
  id: string; season_id: string | null; style_id: string
  colorway_id: string | null; buyer_name: string
  buyer_po_number: string | null; order_date: string
  delivery_date: string | null; size_breakdown: Record<string, number> | null
  total_units: number; unit_price: number | null; total_value: number | null
  currency: string; status: OrderBookingStatus; notes: string | null
  created_at: string
  styles?: { style_number: string; style_name: string } | null
  colorways?: { color_name: string; color_code: string } | null
}

// ─── Configs ───

export const SEASON_TYPE_CONFIG: Record<SeasonType, { label: string }> = {
  spring_summer: { label: 'Spring/Summer' },
  fall_winter: { label: 'Fall/Winter' },
  resort: { label: 'Resort' },
  pre_fall: { label: 'Pre-Fall' },
  capsule: { label: 'Capsule' },
}

export const SEASON_STATUS_CONFIG: Record<SeasonStatus, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planning', color: '#666', bg: '#f0f0f0' },
  development: { label: 'Development', color: '#D4A843', bg: '#FFF8E1' },
  selling: { label: 'Selling', color: '#1565C0', bg: '#E3F2FD' },
  production: { label: 'Production', color: '#7B1FA2', bg: '#F3E5F5' },
  delivered: { label: 'Delivered', color: '#2E7D32', bg: '#E8F5E9' },
  archived: { label: 'Archived', color: '#9E9E9E', bg: '#f0f0f0' },
}

export const LIFECYCLE_CONFIG: Record<LifecycleStage, { label: string; color: string; bg: string; order: number }> = {
  concept: { label: 'Concept', color: '#666', bg: '#f0f0f0', order: 0 },
  design: { label: 'Design', color: '#1565C0', bg: '#E3F2FD', order: 1 },
  tech_pack: { label: 'Tech Pack', color: '#7B1FA2', bg: '#F3E5F5', order: 2 },
  sampling: { label: 'Sampling', color: '#D4A843', bg: '#FFF8E1', order: 3 },
  costing: { label: 'Costing', color: '#E65100', bg: '#FFF3E0', order: 4 },
  approved: { label: 'Approved', color: '#2E7D32', bg: '#E8F5E9', order: 5 },
  in_production: { label: 'In Production', color: '#00695C', bg: '#E0F2F1', order: 6 },
  delivered: { label: 'Delivered', color: '#1B5E20', bg: '#C8E6C9', order: 7 },
  discontinued: { label: 'Discontinued', color: '#9E9E9E', bg: '#f0f0f0', order: 8 },
}

export const LIFECYCLE_STAGES: LifecycleStage[] = ['concept', 'design', 'tech_pack', 'sampling', 'costing', 'approved', 'in_production', 'delivered']

export const ORDER_STATUS_CONFIG: Record<OrderBookingStatus, { label: string; color: string; bg: string }> = {
  booked: { label: 'Booked', color: '#1565C0', bg: '#E3F2FD' },
  confirmed: { label: 'Confirmed', color: '#2E7D32', bg: '#E8F5E9' },
  in_production: { label: 'In Production', color: '#D4A843', bg: '#FFF8E1' },
  shipped: { label: 'Shipped', color: '#7B1FA2', bg: '#F3E5F5' },
  delivered: { label: 'Delivered', color: '#1B5E20', bg: '#C8E6C9' },
  cancelled: { label: 'Cancelled', color: '#CC0000', bg: '#FFEBEE' },
}

export const LAB_DIP_CONFIG: Record<LabDipStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: '#666', bg: '#f0f0f0' },
  submitted: { label: 'Submitted', color: '#1565C0', bg: '#E3F2FD' },
  approved: { label: 'Approved', color: '#2E7D32', bg: '#E8F5E9' },
  rejected: { label: 'Rejected', color: '#CC0000', bg: '#FFEBEE' },
  resubmit: { label: 'Resubmit', color: '#E65100', bg: '#FFF3E0' },
}

export function generateStyleNumber(category: string, season: string, sequence: number): string {
  const prefixes: Record<string, string> = { woven: 'WV', knits: 'KN', denim: 'DN', outerwear: 'OW', accessories: 'AC' }
  return `${prefixes[category] || 'XX'}-${season}-${String(sequence).padStart(4, '0')}`
}

export const DEFAULT_SEASON_MILESTONES = [
  { name: 'Design Kickoff', type: 'design_kickoff', offsetWeeks: 0 },
  { name: 'Line Plan Due', type: 'line_plan_due', offsetWeeks: 4 },
  { name: 'Tech Pack Due', type: 'tech_pack_due', offsetWeeks: 8 },
  { name: 'Proto Sample Due', type: 'proto_sample_due', offsetWeeks: 12 },
  { name: 'Fit Sample Due', type: 'fit_sample_due', offsetWeeks: 16 },
  { name: 'Costing Due', type: 'costing_due', offsetWeeks: 18 },
  { name: 'Sales Meeting', type: 'sales_meeting', offsetWeeks: 20 },
  { name: 'Order Deadline', type: 'order_deadline', offsetWeeks: 22 },
  { name: 'PP Sample Due', type: 'pp_sample_due', offsetWeeks: 24 },
  { name: 'Bulk Fabric Due', type: 'bulk_fabric_due', offsetWeeks: 26 },
  { name: 'Production Start', type: 'production_start', offsetWeeks: 28 },
  { name: 'Production End', type: 'production_end', offsetWeeks: 36 },
  { name: 'Ex-Factory', type: 'ex_factory', offsetWeeks: 38 },
  { name: 'Warehouse Delivery', type: 'warehouse_delivery', offsetWeeks: 42 },
  { name: 'Retail Launch', type: 'retail_launch', offsetWeeks: 44 },
]
