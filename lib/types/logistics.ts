export type ShippingMode = 'sea_fcl' | 'sea_lcl' | 'air' | 'courier' | 'rail' | 'road'

export type ShipmentStatus =
  | 'booking' | 'booked' | 'at_origin_port' | 'customs_clearance_origin'
  | 'in_transit' | 'at_destination_port' | 'customs_clearance_destination'
  | 'last_mile' | 'delivered' | 'cancelled'

export type ContainerSize = '20ft' | '40ft' | '40ft_hc' | 'LCL' | 'N/A'

export type Incoterm = 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DDP' | 'DAP' | 'FCA'

export type MilestoneStatus = 'pending' | 'completed' | 'delayed' | 'skipped'

export type DocumentType =
  | 'bill_of_lading' | 'airway_bill' | 'commercial_invoice' | 'packing_list'
  | 'certificate_of_origin' | 'inspection_certificate' | 'insurance_certificate'
  | 'customs_declaration' | 'phytosanitary_cert' | 'fumigation_cert' | 'other'

export type DocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected'

export type CarrierType = 'shipping_line' | 'airline' | 'courier' | 'freight_forwarder' | 'trucking'

export interface Shipment {
  id: string
  project_id: string | null
  production_order_id: string | null
  purchase_order_id: string | null
  shipment_number: string
  shipping_mode: ShippingMode
  status: ShipmentStatus
  carrier_name: string | null
  carrier_booking_ref: string | null
  vessel_name: string | null
  voyage_number: string | null
  container_number: string | null
  container_size: ContainerSize | null
  bill_of_lading: string | null
  airway_bill: string | null
  tracking_number: string | null
  origin_country: string | null
  origin_port: string | null
  origin_address: string | null
  destination_country: string | null
  destination_port: string | null
  destination_address: string | null
  estimated_departure: string | null
  actual_departure: string | null
  estimated_arrival: string | null
  actual_arrival: string | null
  total_cartons: number
  total_pieces: number
  gross_weight_kg: number
  net_weight_kg: number
  volume_cbm: number
  freight_cost: number
  freight_currency: string
  insurance_cost: number
  customs_duty: number
  other_charges: number
  total_logistics_cost: number
  incoterm: Incoterm | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  projects?: { name: string } | null
}

export interface ShipmentMilestone {
  id: string
  shipment_id: string
  milestone_order: number
  milestone_name: string
  location: string | null
  planned_date: string | null
  actual_date: string | null
  status: MilestoneStatus
  notes: string | null
  updated_by: string | null
  created_at: string
}

export interface PackingListItem {
  id: string
  shipment_id: string
  packing_list_number: string
  carton_number: string
  style_number: string | null
  color: string | null
  size_breakdown: Record<string, number> | null
  total_pcs: number
  gross_weight_kg: number | null
  net_weight_kg: number | null
  carton_dimensions: string | null
  created_at: string
}

export interface ShippingDocument {
  id: string
  shipment_id: string
  document_type: DocumentType
  document_number: string | null
  file_url: string | null
  file_name: string | null
  status: DocumentStatus
  notes: string | null
  uploaded_by: string | null
  created_at: string
}

export interface Carrier {
  id: string
  carrier_name: string
  carrier_code: string | null
  carrier_type: CarrierType | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  tracking_url_template: string | null
  is_active: boolean
  created_at: string
}

// ─── Configs ───

export const SHIPPING_MODE_CONFIG: Record<ShippingMode, { label: string; icon: string; color: string; bg: string }> = {
  sea_fcl: { label: 'Sea (FCL)', icon: 'Ship', color: '#1565C0', bg: '#E3F2FD' },
  sea_lcl: { label: 'Sea (LCL)', icon: 'Ship', color: '#0277BD', bg: '#E1F5FE' },
  air: { label: 'Air', icon: 'Plane', color: '#7B1FA2', bg: '#F3E5F5' },
  courier: { label: 'Courier', icon: 'Package', color: '#E65100', bg: '#FFF3E0' },
  rail: { label: 'Rail', icon: 'TrainFront', color: '#2E7D32', bg: '#E8F5E9' },
  road: { label: 'Road', icon: 'Truck', color: '#4E342E', bg: '#EFEBE9' },
}

export const SHIPMENT_STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; bg: string; order: number }> = {
  booking: { label: 'Booking', color: '#666', bg: '#f0f0f0', order: 0 },
  booked: { label: 'Booked', color: '#1565C0', bg: '#E3F2FD', order: 1 },
  at_origin_port: { label: 'At Origin Port', color: '#D4A843', bg: '#FFF8E1', order: 2 },
  customs_clearance_origin: { label: 'Customs (Origin)', color: '#E65100', bg: '#FFF3E0', order: 3 },
  in_transit: { label: 'In Transit', color: '#7B1FA2', bg: '#F3E5F5', order: 4 },
  at_destination_port: { label: 'At Destination', color: '#00695C', bg: '#E0F2F1', order: 5 },
  customs_clearance_destination: { label: 'Customs (Dest)', color: '#E65100', bg: '#FFF3E0', order: 6 },
  last_mile: { label: 'Last Mile', color: '#1565C0', bg: '#E3F2FD', order: 7 },
  delivered: { label: 'Delivered', color: '#1B5E20', bg: '#C8E6C9', order: 8 },
  cancelled: { label: 'Cancelled', color: '#CC0000', bg: '#FFEBEE', order: 9 },
}

export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, { label: string }> = {
  bill_of_lading: { label: 'Bill of Lading' },
  airway_bill: { label: 'Airway Bill' },
  commercial_invoice: { label: 'Commercial Invoice' },
  packing_list: { label: 'Packing List' },
  certificate_of_origin: { label: 'Certificate of Origin' },
  inspection_certificate: { label: 'Inspection Certificate' },
  insurance_certificate: { label: 'Insurance Certificate' },
  customs_declaration: { label: 'Customs Declaration' },
  phytosanitary_cert: { label: 'Phytosanitary Certificate' },
  fumigation_cert: { label: 'Fumigation Certificate' },
  other: { label: 'Other' },
}

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#666', bg: '#f0f0f0' },
  uploaded: { label: 'Uploaded', color: '#1565C0', bg: '#E3F2FD' },
  verified: { label: 'Verified', color: '#2E7D32', bg: '#E8F5E9' },
  rejected: { label: 'Rejected', color: '#CC0000', bg: '#FFEBEE' },
}

export const CARRIER_TYPE_CONFIG: Record<CarrierType, { label: string }> = {
  shipping_line: { label: 'Shipping Line' },
  airline: { label: 'Airline' },
  courier: { label: 'Courier' },
  freight_forwarder: { label: 'Freight Forwarder' },
  trucking: { label: 'Trucking' },
}

export const INCOTERMS: Incoterm[] = ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP', 'FCA']

export const CONTAINER_SIZES: { value: ContainerSize; label: string }[] = [
  { value: '20ft', label: "20' Container" },
  { value: '40ft', label: "40' Container" },
  { value: '40ft_hc', label: "40' HC Container" },
  { value: 'LCL', label: 'LCL (Less than Container)' },
  { value: 'N/A', label: 'N/A' },
]

export const SHIPMENT_MILESTONES: Record<ShippingMode, { name: string; order: number }[]> = {
  sea_fcl: [
    { name: 'Booking Confirmed', order: 1 },
    { name: 'Cargo Ready at Factory', order: 2 },
    { name: 'Container Loading', order: 3 },
    { name: 'Gate In at Origin Port', order: 4 },
    { name: 'Customs Clearance (Origin)', order: 5 },
    { name: 'Vessel Departed', order: 6 },
    { name: 'Transshipment', order: 7 },
    { name: 'Vessel Arrived at Destination', order: 8 },
    { name: 'Customs Clearance (Destination)', order: 9 },
    { name: 'Container Released', order: 10 },
    { name: 'Last Mile Delivery', order: 11 },
    { name: 'Delivered to Warehouse', order: 12 },
  ],
  sea_lcl: [
    { name: 'Booking Confirmed', order: 1 },
    { name: 'Cargo Drop-off at CFS', order: 2 },
    { name: 'Consolidation', order: 3 },
    { name: 'Customs Clearance (Origin)', order: 4 },
    { name: 'Vessel Departed', order: 5 },
    { name: 'Vessel Arrived', order: 6 },
    { name: 'Deconsolidation', order: 7 },
    { name: 'Customs Clearance (Destination)', order: 8 },
    { name: 'Cargo Ready for Pickup', order: 9 },
    { name: 'Delivered to Warehouse', order: 10 },
  ],
  air: [
    { name: 'Booking Confirmed', order: 1 },
    { name: 'Cargo at Airport', order: 2 },
    { name: 'Customs Clearance (Origin)', order: 3 },
    { name: 'Flight Departed', order: 4 },
    { name: 'Flight Arrived', order: 5 },
    { name: 'Customs Clearance (Destination)', order: 6 },
    { name: 'Delivered to Warehouse', order: 7 },
  ],
  courier: [
    { name: 'Picked Up', order: 1 },
    { name: 'In Transit', order: 2 },
    { name: 'Out for Delivery', order: 3 },
    { name: 'Delivered', order: 4 },
  ],
  rail: [
    { name: 'Booking Confirmed', order: 1 },
    { name: 'Container Loaded', order: 2 },
    { name: 'Customs Clearance (Origin)', order: 3 },
    { name: 'In Transit', order: 4 },
    { name: 'Border Crossing', order: 5 },
    { name: 'Customs Clearance (Destination)', order: 6 },
    { name: 'Arrived at Terminal', order: 7 },
    { name: 'Delivered to Warehouse', order: 8 },
  ],
  road: [
    { name: 'Loaded at Factory', order: 1 },
    { name: 'In Transit', order: 2 },
    { name: 'Border Crossing', order: 3 },
    { name: 'Delivered to Warehouse', order: 4 },
  ],
}

export const REQUIRED_DOCS: Record<ShippingMode, DocumentType[]> = {
  sea_fcl: ['bill_of_lading', 'commercial_invoice', 'packing_list', 'certificate_of_origin', 'insurance_certificate'],
  sea_lcl: ['bill_of_lading', 'commercial_invoice', 'packing_list', 'certificate_of_origin'],
  air: ['airway_bill', 'commercial_invoice', 'packing_list', 'certificate_of_origin'],
  courier: ['commercial_invoice', 'packing_list'],
  rail: ['bill_of_lading', 'commercial_invoice', 'packing_list', 'customs_declaration'],
  road: ['commercial_invoice', 'packing_list'],
}
