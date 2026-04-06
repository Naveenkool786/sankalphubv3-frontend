export type CostSheetStatus = 'draft' | 'pending_approval' | 'approved' | 'revised'

export type CostCategory =
  | 'fabric' | 'trims' | 'accessories' | 'embellishment'
  | 'labels' | 'packaging' | 'CMT' | 'wash' | 'testing'
  | 'logistics' | 'overhead' | 'commission' | 'other'

export interface CostSheet {
  id: string
  project_id: string | null
  production_order_id: string | null
  style_number: string | null
  style_name: string | null
  version: number
  status: CostSheetStatus
  currency: string
  total_cost: number
  target_fob: number | null
  actual_fob: number | null
  margin_percentage: number | null
  notes: string | null
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  projects?: { name: string } | null
}

export interface CostSheetItem {
  id: string
  cost_sheet_id: string
  item_order: number
  cost_category: CostCategory
  description: string
  supplier: string | null
  unit: string
  consumption: number
  unit_price: number
  wastage_percentage: number
  total_per_garment: number
  currency: string
  notes: string | null
  created_at: string
}

export const COST_STATUS_CONFIG: Record<CostSheetStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#666', bg: '#f0f0f0' },
  pending_approval: { label: 'Pending Approval', color: '#D4A843', bg: '#FFF8E1' },
  approved: { label: 'Approved', color: '#2E7D32', bg: '#E8F5E9' },
  revised: { label: 'Revised', color: '#1565C0', bg: '#E3F2FD' },
}

export const COST_CATEGORY_CONFIG: Record<CostCategory, { label: string; color: string }> = {
  fabric: { label: 'Fabric', color: '#1565C0' },
  trims: { label: 'Trims', color: '#D4A843' },
  accessories: { label: 'Accessories', color: '#7B1FA2' },
  embellishment: { label: 'Embellishment', color: '#E65100' },
  labels: { label: 'Labels', color: '#00695C' },
  packaging: { label: 'Packaging', color: '#4E342E' },
  CMT: { label: 'CMT', color: '#CC0000' },
  wash: { label: 'Wash', color: '#0277BD' },
  testing: { label: 'Testing', color: '#558B2F' },
  logistics: { label: 'Logistics', color: '#F57F17' },
  overhead: { label: 'Overhead', color: '#616161' },
  commission: { label: 'Commission', color: '#AD1457' },
  other: { label: 'Other', color: '#9E9E9E' },
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
]

export const DEFAULT_COST_CATEGORIES: Record<string, CostCategory[]> = {
  woven: ['fabric', 'trims', 'labels', 'packaging', 'CMT', 'wash', 'testing', 'overhead'],
  knits: ['fabric', 'trims', 'labels', 'packaging', 'CMT', 'testing', 'overhead'],
  denim: ['fabric', 'trims', 'labels', 'packaging', 'CMT', 'wash', 'testing', 'overhead'],
  outerwear: ['fabric', 'trims', 'accessories', 'labels', 'packaging', 'CMT', 'testing', 'overhead'],
  accessories: ['fabric', 'trims', 'accessories', 'packaging', 'CMT', 'overhead'],
}

export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol || code
}

export function formatMoney(amount: number, currency: string): string {
  const sym = getCurrencySymbol(currency)
  return `${sym}${amount.toFixed(2)}`
}
