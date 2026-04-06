'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'

export async function createProductionPlan(data: {
  project_id: string
  factory_id: string
  category: string
  planned_start: string
  planned_end: string
  total_quantity: number
  daily_target: number
}) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('production_plans') as any).insert({
    org_id: ctx.orgId,
    ...data,
    status: 'planned',
  })
  if (error) throw new Error(error.message)
  revalidatePath('/planning')
}

export async function saveDPR(data: {
  plan_id: string
  report_date: string
  entries: { stage: string; target_qty: number; actual_qty: number; defect_qty: number; notes: string }[]
}) {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  for (const entry of data.entries) {
    const efficiency = entry.target_qty > 0 ? Math.round((entry.actual_qty / entry.target_qty) * 100) : 0
    const { error } = await (supabase.from('daily_production_reports') as any).upsert({
      plan_id: data.plan_id,
      report_date: data.report_date,
      stage: entry.stage,
      target_qty: entry.target_qty,
      actual_qty: entry.actual_qty,
      defect_qty: entry.defect_qty,
      efficiency_pct: efficiency,
      notes: entry.notes || null,
      reported_by: ctx.userId,
    }, { onConflict: 'plan_id,report_date,stage' })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/planning')
}

export async function updateWIPEntry(data: {
  plan_id: string
  stage: string
  quantity: number
  status: 'in_progress' | 'completed' | 'held'
}) {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const { error } = await (supabase.from('wip_entries') as any).upsert({
    plan_id: data.plan_id,
    stage: data.stage,
    quantity: data.quantity,
    status: data.status,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'plan_id,stage' })
  if (error) throw new Error(error.message)
  revalidatePath('/planning')
}
