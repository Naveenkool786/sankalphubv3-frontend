export type QuotationStatus =
  | 'draft' | 'sent' | 'received' | 'under_review'
  | 'negotiating' | 'accepted' | 'rejected' | 'expired'

export type POStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'sent_to_supplier'
  | 'acknowledged' | 'in_production' | 'partially_shipped'
  | 'shipped' | 'received' | 'cancelled'

export type InvoiceStatus = 'pending' | 'matched' | 'disputed' | 'approved' | 'paid' | 'cancelled'
export type MatchStatus = 'unmatched' | 'matched' | 'partial_match' | 'mismatch'

export interface Quotation {
  id: string
  project_id: string | null
  quotation_number: string
  supplier_name: string
  supplier_contact: string | null
  supplier_email: string | null
  factory_id: string | null
  status: QuotationStatus
  valid_until: string | null
  currency: string
  total_amount: number
  payment_terms: string | null
  delivery_terms: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  projects?: { name: string } | null
  factories?: { name: string } | null
}

export interface QuotationItem {
  id: string
  quotation_id: string
  description: string
  style_number: string | null
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  notes: string | null
  created_at: string
}

export interface PurchaseOrder {
  id: string
  project_id: string | null
  production_order_id: string | null
  quotation_id: string | null
  po_number: string
  supplier_name: string
  factory_id: string | null
  status: POStatus
  currency: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  payment_terms: string | null
  delivery_terms: string | null
  ship_by_date: string | null
  delivery_address: string | null
  notes: string | null
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  projects?: { name: string } | null
  factories?: { name: string } | null
}

export interface POItem {
  id: string
  purchase_order_id: string
  description: string
  style_number: string | null
  color: string | null
  size: string | null
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  received_qty: number
  notes: string | null
  created_at: string
}

export interface Invoice {
  id: string
  purchase_order_id: string | null
  invoice_number: string
  supplier_name: string
  status: InvoiceStatus
  currency: string
  invoice_amount: number
  invoice_date: string | null
  due_date: string | null
  match_status: MatchStatus
  po_amount: number | null
  receipt_amount: number | null
  variance_amount: number | null
  payment_reference: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  purchase_orders?: { po_number: string; total_amount: number; supplier_name: string } | null
}

export const QUOTATION_STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#666', bg: '#f0f0f0' },
  sent: { label: 'Sent', color: '#1565C0', bg: '#E3F2FD' },
  received: { label: 'Received', color: '#7B1FA2', bg: '#F3E5F5' },
  under_review: { label: 'Under Review', color: '#D4A843', bg: '#FFF8E1' },
  negotiating: { label: 'Negotiating', color: '#E65100', bg: '#FFF3E0' },
  accepted: { label: 'Accepted', color: '#2E7D32', bg: '#E8F5E9' },
  rejected: { label: 'Rejected', color: '#CC0000', bg: '#FFEBEE' },
  expired: { label: 'Expired', color: '#9E9E9E', bg: '#f0f0f0' },
}

export const PO_STATUS_CONFIG: Record<POStatus, { label: string; color: string; bg: string; order: number }> = {
  draft: { label: 'Draft', color: '#666', bg: '#f0f0f0', order: 0 },
  pending_approval: { label: 'Pending Approval', color: '#D4A843', bg: '#FFF8E1', order: 1 },
  approved: { label: 'Approved', color: '#2E7D32', bg: '#E8F5E9', order: 2 },
  sent_to_supplier: { label: 'Sent to Supplier', color: '#1565C0', bg: '#E3F2FD', order: 3 },
  acknowledged: { label: 'Acknowledged', color: '#00695C', bg: '#E0F2F1', order: 4 },
  in_production: { label: 'In Production', color: '#E65100', bg: '#FFF3E0', order: 5 },
  partially_shipped: { label: 'Partially Shipped', color: '#7B1FA2', bg: '#F3E5F5', order: 6 },
  shipped: { label: 'Shipped', color: '#1565C0', bg: '#E3F2FD', order: 7 },
  received: { label: 'Received', color: '#1B5E20', bg: '#C8E6C9', order: 8 },
  cancelled: { label: 'Cancelled', color: '#CC0000', bg: '#FFEBEE', order: 9 },
}

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#D4A843', bg: '#FFF8E1' },
  matched: { label: 'Matched', color: '#2E7D32', bg: '#E8F5E9' },
  disputed: { label: 'Disputed', color: '#CC0000', bg: '#FFEBEE' },
  approved: { label: 'Approved', color: '#1565C0', bg: '#E3F2FD' },
  paid: { label: 'Paid', color: '#1B5E20', bg: '#C8E6C9' },
  cancelled: { label: 'Cancelled', color: '#9E9E9E', bg: '#f0f0f0' },
}

export const MATCH_STATUS_CONFIG: Record<MatchStatus, { label: string; color: string; bg: string }> = {
  unmatched: { label: 'Unmatched', color: '#666', bg: '#f0f0f0' },
  matched: { label: 'Matched', color: '#2E7D32', bg: '#E8F5E9' },
  partial_match: { label: 'Partial Match', color: '#E65100', bg: '#FFF3E0' },
  mismatch: { label: 'Mismatch', color: '#CC0000', bg: '#FFEBEE' },
}

export const PO_STATUS_ORDER: POStatus[] = [
  'draft', 'pending_approval', 'approved', 'sent_to_supplier',
  'acknowledged', 'in_production', 'partially_shipped',
  'shipped', 'received',
]

export function calculateMatch(po: number, receipt: number, invoice: number): MatchStatus {
  const variance = Math.abs(invoice - po)
  const tolerance = po * 0.02
  if (variance <= tolerance && receipt >= po * 0.95) return 'matched'
  if (variance <= tolerance) return 'partial_match'
  return 'mismatch'
}
