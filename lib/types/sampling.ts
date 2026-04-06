export type SampleType = 'proto' | 'fit' | 'size_set' | 'pp' | 'top_of_production' | 'shipment'
export type SampleStatus = 'requested' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'approved_with_comments' | 'rejected' | 'cancelled'

export const STAGE_ORDER: SampleType[] = ['proto', 'fit', 'size_set', 'pp', 'top_of_production', 'shipment']

export const SAMPLE_TYPE_CONFIG: Record<SampleType, { label: string; color: string; bg: string }> = {
  proto: { label: 'Proto', color: '#666', bg: '#f0f0f0' },
  fit: { label: 'Fit', color: '#1565C0', bg: '#E3F2FD' },
  size_set: { label: 'Size Set', color: '#7B1FA2', bg: '#F3E5F5' },
  pp: { label: 'PP', color: '#D4A843', bg: '#FFF8E1' },
  top_of_production: { label: 'TOP', color: '#2E7D32', bg: '#E8F5E9' },
  shipment: { label: 'Shipment', color: '#1B5E20', bg: '#C8E6C9' },
}

export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, { label: string; color: string; bg: string }> = {
  requested: { label: 'Requested', color: '#666', bg: '#f0f0f0' },
  in_progress: { label: 'In Progress', color: '#1565C0', bg: '#E3F2FD' },
  submitted: { label: 'Submitted', color: '#D4A843', bg: '#FFF8E1' },
  under_review: { label: 'Under Review', color: '#7B1FA2', bg: '#F3E5F5' },
  approved: { label: 'Approved', color: '#2E7D32', bg: '#E8F5E9' },
  approved_with_comments: { label: 'Approved*', color: '#2E7D32', bg: '#E8F5E9' },
  rejected: { label: 'Rejected', color: '#CC0000', bg: '#FFEBEE' },
  cancelled: { label: 'Cancelled', color: '#999', bg: '#f5f5f5' },
}

export interface SampleRequest {
  id: string
  project_id: string
  production_order_id: string | null
  request_number: string
  style_number: string | null
  style_name: string | null
  category: string | null
  sample_type: SampleType
  factory_id: string | null
  buyer_brand: string | null
  required_date: string | null
  actual_submit_date: string | null
  status: SampleStatus
  priority: string
  revision_number: number
  size_range: string | null
  color: string | null
  fabric_details: string | null
  special_instructions: string | null
  created_by: string | null
  created_at: string
  factories?: { name: string } | null
  projects?: { name: string } | null
}

export interface SampleComment {
  id: string
  sample_request_id: string
  comment_type: string
  comment: string
  author_role: string | null
  is_internal: boolean
  created_by: string | null
  created_at: string
  profiles?: { full_name: string } | null
}

export interface SampleMeasurement {
  id: string
  sample_request_id: string
  size: string
  point_of_measure: string
  spec_value: number | null
  actual_value: number | null
  tolerance_plus: number
  tolerance_minus: number
  status: 'pass' | 'fail' | 'pending'
  unit: string
  revision_number: number
}

export function checkMeasurement(spec: number, actual: number, tolPlus: number, tolMinus: number): 'pass' | 'fail' {
  return (actual >= spec - tolMinus && actual <= spec + tolPlus) ? 'pass' : 'fail'
}
