'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { addWeeks, format } from 'date-fns'
import { DEFAULT_SEASON_MILESTONES } from '@/lib/types/merchandising'

// ─── Seasons ───

export async function createSeason(data: {
  season_code: string; season_name: string; year: number
  season_type?: string; start_date?: string; end_date?: string
  target_styles?: number; target_units?: number; target_revenue?: number
  currency?: string; notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()

    const { data: season, error } = await (supabase.from('seasons') as any).insert({
      season_code: data.season_code,
      season_name: data.season_name,
      year: data.year,
      season_type: data.season_type || null,
      status: 'planning',
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      target_styles: data.target_styles || 0,
      target_units: data.target_units || 0,
      target_revenue: data.target_revenue || 0,
      currency: data.currency || 'USD',
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    // Auto-create calendar milestones
    if (data.start_date) {
      const startDate = new Date(data.start_date)
      const milestones = DEFAULT_SEASON_MILESTONES.map(m => ({
        season_id: season.id,
        milestone_name: m.name,
        milestone_type: m.type,
        planned_date: format(addWeeks(startDate, m.offsetWeeks), 'yyyy-MM-dd'),
        status: 'upcoming',
        created_by: ctx.userId,
      }))
      await (supabase.from('seasonal_calendar') as any).insert(milestones)
    }

    revalidatePath('/merchandising/seasons')
    return { success: true, id: season.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateSeasonStatus(seasonId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()
    const { error } = await (supabase.from('seasons') as any).update({ status, updated_at: new Date().toISOString() }).eq('id', seasonId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/merchandising/seasons')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Styles ───

export async function createStyle(data: {
  style_number: string; style_name: string; season_id?: string; project_id?: string
  category?: string; sub_category?: string; gender?: string; description?: string
  wholesale_price?: number; retail_price?: number; target_fob?: number
  currency?: string; fabric_composition?: string; weight_gsm?: number
  construction?: string; silhouette?: string; factory_id?: string
  buyer_brand?: string; is_carryover?: boolean
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()

    const { data: style, error } = await (supabase.from('styles') as any).insert({
      style_number: data.style_number,
      style_name: data.style_name,
      season_id: data.season_id || null,
      project_id: data.project_id || null,
      category: data.category || null,
      sub_category: data.sub_category || null,
      gender: data.gender || null,
      description: data.description || null,
      wholesale_price: data.wholesale_price || null,
      retail_price: data.retail_price || null,
      target_fob: data.target_fob || null,
      currency: data.currency || 'USD',
      fabric_composition: data.fabric_composition || null,
      weight_gsm: data.weight_gsm || null,
      construction: data.construction || null,
      silhouette: data.silhouette || null,
      factory_id: data.factory_id || null,
      buyer_brand: data.buyer_brand || null,
      is_carryover: data.is_carryover || false,
      lifecycle_stage: 'concept',
      status: 'active',
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/merchandising/styles')
    return { success: true, id: style.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateStyleLifecycle(styleId: string, stage: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()
    const { error } = await (supabase.from('styles') as any).update({ lifecycle_stage: stage, updated_at: new Date().toISOString() }).eq('id', styleId)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/merchandising/styles/${styleId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Colorways ───

export async function addColorway(styleId: string, data: {
  color_code: string; color_name: string; hex_value?: string; pantone_code?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()
    const { error } = await (supabase.from('colorways') as any).insert({
      style_id: styleId, color_code: data.color_code, color_name: data.color_name,
      hex_value: data.hex_value || null, pantone_code: data.pantone_code || null,
      status: 'active', lab_dip_status: 'not_started',
    })
    if (error) return { success: false, error: error.message }
    revalidatePath(`/merchandising/styles/${styleId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Tech Packs ───

export async function createTechPack(styleId: string, data: {
  garment_description?: string; fit_type?: string; design_details?: string
  stitching_details?: string; label_placement?: string; packaging_instructions?: string
  wash_care_instructions?: string; grading_rule?: string; base_size?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()

    const { data: tp, error } = await (supabase.from('tech_packs') as any).insert({
      style_id: styleId, version: 1, status: 'draft',
      garment_description: data.garment_description || null,
      fit_type: data.fit_type || null, design_details: data.design_details || null,
      stitching_details: data.stitching_details || null,
      label_placement: data.label_placement || null,
      packaging_instructions: data.packaging_instructions || null,
      wash_care_instructions: data.wash_care_instructions || null,
      grading_rule: data.grading_rule || null, base_size: data.base_size || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }
    revalidatePath(`/merchandising/styles/${styleId}`)
    return { success: true, id: tp.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function addTechPackMeasurement(techPackId: string, data: {
  pom_code: string; description: string; size_specs: Record<string, string>
  tolerance_plus?: number; tolerance_minus?: number; unit?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { data: existing } = await (supabase.from('tech_pack_measurements') as any)
      .select('sort_order').eq('tech_pack_id', techPackId).order('sort_order', { ascending: false }).limit(1)
    const nextOrder = (existing?.[0]?.sort_order || 0) + 1

    const { error } = await (supabase.from('tech_pack_measurements') as any).insert({
      tech_pack_id: techPackId, pom_code: data.pom_code, description: data.description,
      unit: data.unit || 'inches', tolerance_plus: data.tolerance_plus ?? 0.5,
      tolerance_minus: data.tolerance_minus ?? 0.5, size_specs: data.size_specs,
      sort_order: nextOrder,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── BOM ───

export async function addStyleBOMItem(styleId: string, data: {
  bom_category: string; description: string; supplier?: string
  consumption_per_unit?: number; unit?: string; unit_price?: number; wastage_pct?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()
    const { data: existing } = await (supabase.from('style_bom') as any)
      .select('item_order').eq('style_id', styleId).order('item_order', { ascending: false }).limit(1)
    const nextOrder = (existing?.[0]?.item_order || 0) + 1

    const consumption = data.consumption_per_unit || 0
    const price = data.unit_price || 0
    const wastage = data.wastage_pct || 0
    const totalCost = consumption * price * (1 + wastage / 100)

    const { error } = await (supabase.from('style_bom') as any).insert({
      style_id: styleId, item_order: nextOrder,
      bom_category: data.bom_category, description: data.description,
      supplier: data.supplier || null, consumption_per_unit: consumption,
      unit: data.unit || 'yard', unit_price: price, wastage_pct: wastage,
      total_cost_per_unit: totalCost, currency: 'USD', status: 'pending',
    })
    if (error) return { success: false, error: error.message }
    revalidatePath(`/merchandising/styles/${styleId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Orders ───

export async function createOrderBooking(data: {
  season_id?: string; style_id: string; colorway_id?: string
  buyer_name: string; buyer_po_number?: string
  delivery_date?: string; size_breakdown?: Record<string, number>
  total_units: number; unit_price?: number; notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }
    const supabase = createAdminClient()

    const totalValue = data.total_units * (data.unit_price || 0)

    const { data: order, error } = await (supabase.from('order_bookings') as any).insert({
      season_id: data.season_id || null, style_id: data.style_id,
      colorway_id: data.colorway_id || null, buyer_name: data.buyer_name,
      buyer_po_number: data.buyer_po_number || null,
      delivery_date: data.delivery_date || null,
      size_breakdown: data.size_breakdown || null,
      total_units: data.total_units, unit_price: data.unit_price || null,
      total_value: totalValue, currency: 'USD', status: 'booked',
      notes: data.notes || null, created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/merchandising/orders')
    return { success: true, id: order.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

// ─── Calendar ───

export async function updateCalendarMilestone(milestoneId: string, data: {
  actual_date?: string; status?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const updateData: Record<string, any> = {}
    if (data.actual_date !== undefined) updateData.actual_date = data.actual_date || null
    if (data.status) updateData.status = data.status
    const { error } = await (supabase.from('seasonal_calendar') as any).update(updateData).eq('id', milestoneId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
