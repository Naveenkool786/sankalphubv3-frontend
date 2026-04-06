'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { addDays, format } from 'date-fns'
import { DEFAULT_MILESTONES, type ProductionCategory } from '@/lib/types/production'

function generateOrderNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PO-${date}-${random}`
}

export async function createProductionOrder(data: {
  order_number?: string
  style_number?: string
  style_name?: string
  category: ProductionCategory
  project_id: string
  factory_id?: string
  buyer_brand?: string
  season?: string
  total_quantity: number
  unit?: string
  planned_start_date: string
  planned_end_date: string
  ex_factory_date?: string
  priority?: string
  notes?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const orderNumber = data.order_number || generateOrderNumber()

    const { data: order, error } = await (supabase.from('production_orders') as any).insert({
      project_id: data.project_id,
      order_number: orderNumber,
      style_number: data.style_number || null,
      style_name: data.style_name || null,
      category: data.category,
      factory_id: data.factory_id || null,
      buyer_brand: data.buyer_brand || null,
      season: data.season || null,
      total_quantity: data.total_quantity,
      unit: data.unit || 'pcs',
      status: 'planning',
      priority: data.priority || 'normal',
      planned_start_date: data.planned_start_date,
      planned_end_date: data.planned_end_date,
      ex_factory_date: data.ex_factory_date || null,
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    // Auto-generate milestones from template
    const milestoneTemplate = DEFAULT_MILESTONES[data.category] || DEFAULT_MILESTONES.woven
    let currentDate = new Date(data.planned_start_date)

    const milestones = milestoneTemplate.map(m => {
      const planned_start = format(currentDate, 'yyyy-MM-dd')
      const planned_end = format(addDays(currentDate, m.defaultDays), 'yyyy-MM-dd')
      currentDate = addDays(new Date(planned_end), 1)
      return {
        production_order_id: order.id,
        milestone_name: m.name,
        milestone_order: m.order,
        planned_start,
        planned_end,
        status: 'pending',
        completion_percentage: 0,
        delay_days: 0,
      }
    })

    await (supabase.from('production_milestones') as any).insert(milestones)

    revalidatePath('/production')
    return { success: true, id: order.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateMilestoneStatus(milestoneId: string, data: {
  status?: string
  actual_start?: string
  actual_end?: string
  completion_percentage?: number
  delay_reason?: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const updateData: Record<string, any> = { updated_by: ctx.userId, updated_at: new Date().toISOString() }
    if (data.status) updateData.status = data.status
    if (data.actual_start) updateData.actual_start = data.actual_start
    if (data.actual_end) updateData.actual_end = data.actual_end
    if (data.completion_percentage !== undefined) updateData.completion_percentage = data.completion_percentage
    if (data.delay_reason) updateData.delay_reason = data.delay_reason
    if (data.notes !== undefined) updateData.notes = data.notes

    // Calculate delay
    if (data.actual_end) {
      const { data: milestone } = await (supabase.from('production_milestones') as any).select('planned_end').eq('id', milestoneId).single()
      if (milestone?.planned_end) {
        const planned = new Date(milestone.planned_end)
        const actual = new Date(data.actual_end)
        const diff = Math.ceil((actual.getTime() - planned.getTime()) / 86400000)
        updateData.delay_days = diff > 0 ? diff : 0
      }
    }

    const { error } = await (supabase.from('production_milestones') as any).update(updateData).eq('id', milestoneId)
    if (error) return { success: false, error: error.message }

    revalidatePath('/production')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function addDailyLog(orderId: string, data: {
  log_date: string
  milestone_name?: string
  planned_qty: number
  actual_qty: number
  defect_qty?: number
  rework_qty?: number
  operator_count?: number
  machine_count?: number
  remarks?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    // Get cumulative qty
    const { data: logs } = await (supabase.from('production_daily_logs') as any)
      .select('actual_qty')
      .eq('production_order_id', orderId)
      .order('log_date', { ascending: true })

    const prevCumulative = (logs ?? []).reduce((s: number, l: any) => s + (l.actual_qty || 0), 0)
    const cumulative = prevCumulative + data.actual_qty
    const efficiency = data.planned_qty > 0 ? Math.round((data.actual_qty / data.planned_qty) * 100 * 100) / 100 : 0

    const { error } = await (supabase.from('production_daily_logs') as any).insert({
      production_order_id: orderId,
      log_date: data.log_date,
      milestone_name: data.milestone_name || null,
      planned_qty: data.planned_qty,
      actual_qty: data.actual_qty,
      cumulative_qty: cumulative,
      efficiency_percentage: efficiency,
      defect_qty: data.defect_qty || 0,
      rework_qty: data.rework_qty || 0,
      operator_count: data.operator_count || null,
      machine_count: data.machine_count || null,
      remarks: data.remarks || null,
      logged_by: ctx.userId,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/production')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function reportDelay(orderId: string, data: {
  milestone_name?: string
  delay_type: string
  severity?: string
  delay_days: number
  description: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const { error } = await (supabase.from('production_delays') as any).insert({
      production_order_id: orderId,
      milestone_name: data.milestone_name || null,
      delay_type: data.delay_type,
      severity: data.severity || 'medium',
      delay_days: data.delay_days,
      description: data.description,
      reported_by: ctx.userId,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/production')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateProductionOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await (supabase.from('production_orders') as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/production')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
