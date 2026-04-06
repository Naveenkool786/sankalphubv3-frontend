'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import type { CostCategory } from '@/lib/types/costing'

export async function createCostSheet(data: {
  project_id: string
  production_order_id?: string
  style_number?: string
  style_name?: string
  currency?: string
  target_fob?: number
  notes?: string
  template_categories?: CostCategory[]
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()

    const { data: sheet, error } = await (supabase.from('cost_sheets') as any).insert({
      project_id: data.project_id,
      production_order_id: data.production_order_id || null,
      style_number: data.style_number || null,
      style_name: data.style_name || null,
      currency: data.currency || 'USD',
      target_fob: data.target_fob || null,
      notes: data.notes || null,
      status: 'draft',
      version: 1,
      total_cost: 0,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    // Pre-fill BOM rows from template categories
    if (data.template_categories && data.template_categories.length > 0) {
      const items = data.template_categories.map((cat, i) => ({
        cost_sheet_id: sheet.id,
        item_order: i + 1,
        cost_category: cat,
        description: cat === 'CMT' ? 'Cut, Make & Trim' : cat.charAt(0).toUpperCase() + cat.slice(1),
        unit: cat === 'CMT' ? 'pcs' : 'yard',
        consumption: 0,
        unit_price: 0,
        wastage_percentage: 0,
        currency: data.currency || 'USD',
      }))
      await (supabase.from('cost_sheet_items') as any).insert(items)
    }

    revalidatePath('/costing')
    return { success: true, id: sheet.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function addCostSheetItem(sheetId: string, data: {
  cost_category: CostCategory
  description: string
  supplier?: string
  unit?: string
  consumption?: number
  unit_price?: number
  wastage_percentage?: number
  currency?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()

    // Get max order
    const { data: existing } = await (supabase.from('cost_sheet_items') as any)
      .select('item_order')
      .eq('cost_sheet_id', sheetId)
      .order('item_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.item_order || 0) + 1

    const { error } = await (supabase.from('cost_sheet_items') as any).insert({
      cost_sheet_id: sheetId,
      item_order: nextOrder,
      cost_category: data.cost_category,
      description: data.description,
      supplier: data.supplier || null,
      unit: data.unit || 'yard',
      consumption: data.consumption || 0,
      unit_price: data.unit_price || 0,
      wastage_percentage: data.wastage_percentage || 0,
      currency: data.currency || 'USD',
      notes: data.notes || null,
    })

    if (error) return { success: false, error: error.message }

    // Recalculate total
    await recalcCostSheet(supabase, sheetId)

    revalidatePath(`/costing/${sheetId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateCostSheetItem(itemId: string, sheetId: string, data: {
  cost_category?: CostCategory
  description?: string
  supplier?: string
  unit?: string
  consumption?: number
  unit_price?: number
  wastage_percentage?: number
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = {}
    if (data.cost_category !== undefined) updateData.cost_category = data.cost_category
    if (data.description !== undefined) updateData.description = data.description
    if (data.supplier !== undefined) updateData.supplier = data.supplier || null
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.consumption !== undefined) updateData.consumption = data.consumption
    if (data.unit_price !== undefined) updateData.unit_price = data.unit_price
    if (data.wastage_percentage !== undefined) updateData.wastage_percentage = data.wastage_percentage
    if (data.notes !== undefined) updateData.notes = data.notes || null

    const { error } = await (supabase.from('cost_sheet_items') as any).update(updateData).eq('id', itemId)
    if (error) return { success: false, error: error.message }

    await recalcCostSheet(supabase, sheetId)

    revalidatePath(`/costing/${sheetId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function deleteCostSheetItem(itemId: string, sheetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('cost_sheet_items') as any).delete().eq('id', itemId)
    if (error) return { success: false, error: error.message }

    await recalcCostSheet(supabase, sheetId)

    revalidatePath(`/costing/${sheetId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateCostSheetStatus(sheetId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() }

    if (status === 'approved') {
      updateData.approved_by = ctx.userId
      updateData.approved_at = new Date().toISOString()
    }

    const { error } = await (supabase.from('cost_sheets') as any).update(updateData).eq('id', sheetId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/costing/${sheetId}`)
    revalidatePath('/costing')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateCostSheetFOB(sheetId: string, data: {
  target_fob?: number
  actual_fob?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (data.target_fob !== undefined) updateData.target_fob = data.target_fob
    if (data.actual_fob !== undefined) {
      updateData.actual_fob = data.actual_fob
      // Recalc margin
      const { data: sheet } = await (supabase.from('cost_sheets') as any).select('total_cost').eq('id', sheetId).single()
      if (sheet && data.actual_fob > 0) {
        updateData.margin_percentage = Math.round(((data.actual_fob - sheet.total_cost) / data.actual_fob) * 100 * 100) / 100
      }
    }

    const { error } = await (supabase.from('cost_sheets') as any).update(updateData).eq('id', sheetId)
    if (error) return { success: false, error: error.message }

    revalidatePath(`/costing/${sheetId}`)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

async function recalcCostSheet(supabase: any, sheetId: string) {
  const { data: items } = await (supabase.from('cost_sheet_items') as any)
    .select('total_per_garment')
    .eq('cost_sheet_id', sheetId)

  const totalCost = (items ?? []).reduce((s: number, i: any) => s + (i.total_per_garment || 0), 0)

  const { data: sheet } = await (supabase.from('cost_sheets') as any)
    .select('actual_fob')
    .eq('id', sheetId)
    .single()

  const updateData: Record<string, any> = { total_cost: totalCost, updated_at: new Date().toISOString() }
  if (sheet?.actual_fob && sheet.actual_fob > 0) {
    updateData.margin_percentage = Math.round(((sheet.actual_fob - totalCost) / sheet.actual_fob) * 100 * 100) / 100
  }

  await (supabase.from('cost_sheets') as any).update(updateData).eq('id', sheetId)
}
