'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { SHIPMENT_MILESTONES, type ShippingMode } from '@/lib/types/logistics'

function generateShipmentNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `SHP-${date}-${random}`
}

export async function createShipment(data: {
  project_id?: string
  production_order_id?: string
  purchase_order_id?: string
  shipping_mode: ShippingMode
  carrier_name?: string
  carrier_booking_ref?: string
  vessel_name?: string
  voyage_number?: string
  container_number?: string
  container_size?: string
  incoterm?: string
  origin_country?: string
  origin_port?: string
  origin_address?: string
  destination_country?: string
  destination_port?: string
  destination_address?: string
  estimated_departure?: string
  estimated_arrival?: string
  total_cartons?: number
  total_pieces?: number
  gross_weight_kg?: number
  net_weight_kg?: number
  volume_cbm?: number
  notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const shipmentNumber = generateShipmentNumber()

    const { data: shipment, error } = await (supabase.from('shipments') as any).insert({
      project_id: data.project_id || null,
      production_order_id: data.production_order_id || null,
      purchase_order_id: data.purchase_order_id || null,
      shipment_number: shipmentNumber,
      shipping_mode: data.shipping_mode,
      status: 'booking',
      carrier_name: data.carrier_name || null,
      carrier_booking_ref: data.carrier_booking_ref || null,
      vessel_name: data.vessel_name || null,
      voyage_number: data.voyage_number || null,
      container_number: data.container_number || null,
      container_size: data.container_size || null,
      incoterm: data.incoterm || null,
      origin_country: data.origin_country || null,
      origin_port: data.origin_port || null,
      origin_address: data.origin_address || null,
      destination_country: data.destination_country || null,
      destination_port: data.destination_port || null,
      destination_address: data.destination_address || null,
      estimated_departure: data.estimated_departure || null,
      estimated_arrival: data.estimated_arrival || null,
      total_cartons: data.total_cartons || 0,
      total_pieces: data.total_pieces || 0,
      gross_weight_kg: data.gross_weight_kg || 0,
      net_weight_kg: data.net_weight_kg || 0,
      volume_cbm: data.volume_cbm || 0,
      freight_currency: 'USD',
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    // Auto-generate milestones
    const milestoneTemplate = SHIPMENT_MILESTONES[data.shipping_mode] || SHIPMENT_MILESTONES.courier
    const milestones = milestoneTemplate.map(m => ({
      shipment_id: shipment.id,
      milestone_order: m.order,
      milestone_name: m.name,
      status: 'pending',
    }))
    await (supabase.from('shipment_milestones') as any).insert(milestones)

    revalidatePath('/logistics')
    return { success: true, id: shipment.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateShipmentStatus(shipmentId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() }

    if (status === 'delivered') {
      updateData.actual_arrival = new Date().toISOString().split('T')[0]
    }

    const { error } = await (supabase.from('shipments') as any).update(updateData).eq('id', shipmentId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/logistics/${shipmentId}`)
    revalidatePath('/logistics')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateMilestone(milestoneId: string, shipmentId: string, data: {
  actual_date?: string
  status?: string
  location?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const updateData: Record<string, any> = { updated_by: ctx.userId }
    if (data.actual_date !== undefined) updateData.actual_date = data.actual_date || null
    if (data.status) updateData.status = data.status
    if (data.location !== undefined) updateData.location = data.location || null
    if (data.notes !== undefined) updateData.notes = data.notes || null

    const { error } = await (supabase.from('shipment_milestones') as any).update(updateData).eq('id', milestoneId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/logistics/${shipmentId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function addPackingListItem(shipmentId: string, data: {
  packing_list_number: string
  carton_number: string
  style_number?: string
  color?: string
  size_breakdown?: Record<string, number>
  total_pcs: number
  gross_weight_kg?: number
  net_weight_kg?: number
  carton_dimensions?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('packing_lists') as any).insert({
      shipment_id: shipmentId,
      packing_list_number: data.packing_list_number,
      carton_number: data.carton_number,
      style_number: data.style_number || null,
      color: data.color || null,
      size_breakdown: data.size_breakdown || null,
      total_pcs: data.total_pcs,
      gross_weight_kg: data.gross_weight_kg || null,
      net_weight_kg: data.net_weight_kg || null,
      carton_dimensions: data.carton_dimensions || null,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath(`/logistics/${shipmentId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function deletePackingListItem(itemId: string, shipmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('packing_lists') as any).delete().eq('id', itemId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/logistics/${shipmentId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function addShippingDocument(shipmentId: string, data: {
  document_type: string
  document_number?: string
  file_url?: string
  file_name?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('shipping_documents') as any).insert({
      shipment_id: shipmentId,
      document_type: data.document_type,
      document_number: data.document_number || null,
      file_url: data.file_url || null,
      file_name: data.file_name || null,
      status: data.file_url ? 'uploaded' : 'pending',
      uploaded_by: ctx.userId,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath(`/logistics/${shipmentId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateDocumentStatus(docId: string, shipmentId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('shipping_documents') as any).update({ status }).eq('id', docId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/logistics/${shipmentId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateShipmentCosts(shipmentId: string, data: {
  freight_cost?: number
  freight_currency?: string
  insurance_cost?: number
  customs_duty?: number
  other_charges?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const freight = data.freight_cost ?? 0
    const insurance = data.insurance_cost ?? 0
    const customs = data.customs_duty ?? 0
    const other = data.other_charges ?? 0

    const { error } = await (supabase.from('shipments') as any).update({
      freight_cost: freight,
      freight_currency: data.freight_currency || 'USD',
      insurance_cost: insurance,
      customs_duty: customs,
      other_charges: other,
      total_logistics_cost: freight + insurance + customs + other,
      updated_at: new Date().toISOString(),
    }).eq('id', shipmentId)

    if (error) return { success: false, error: error.message }
    revalidatePath(`/logistics/${shipmentId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function createCarrier(data: {
  carrier_name: string
  carrier_code?: string
  carrier_type?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  tracking_url_template?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('carriers') as any).insert({
      carrier_name: data.carrier_name,
      carrier_code: data.carrier_code || null,
      carrier_type: data.carrier_type || null,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      website: data.website || null,
      tracking_url_template: data.tracking_url_template || null,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/logistics/carriers')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
