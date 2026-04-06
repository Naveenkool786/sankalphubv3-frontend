'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

function generateRequestNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `SR-${date}-${random}`
}

export async function createSampleRequest(data: {
  project_id: string
  production_order_id?: string
  style_number?: string
  style_name?: string
  category?: string
  sample_type: string
  factory_id?: string
  buyer_brand?: string
  required_date?: string
  priority?: string
  size_range?: string
  color?: string
  fabric_details?: string
  special_instructions?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const { data: sample, error } = await (supabase.from('sample_requests') as any).insert({
      project_id: data.project_id,
      production_order_id: data.production_order_id || null,
      request_number: generateRequestNumber(),
      style_number: data.style_number || null,
      style_name: data.style_name || null,
      category: data.category || null,
      sample_type: data.sample_type,
      factory_id: data.factory_id || null,
      buyer_brand: data.buyer_brand || null,
      required_date: data.required_date || null,
      status: 'requested',
      priority: data.priority || 'normal',
      revision_number: 1,
      size_range: data.size_range || null,
      color: data.color || null,
      fabric_details: data.fabric_details || null,
      special_instructions: data.special_instructions || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/sampling')
    return { success: true, id: sample.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateSampleStatus(sampleId: string, status: string, comment?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() }
    if (status === 'submitted') updateData.actual_submit_date = format(new Date(), 'yyyy-MM-dd')

    const { error } = await (supabase.from('sample_requests') as any).update(updateData).eq('id', sampleId)
    if (error) return { success: false, error: error.message }

    // Add comment if provided (approval/rejection reason)
    if (comment) {
      const commentType = status === 'approved' || status === 'approved_with_comments' ? 'approval' : status === 'rejected' ? 'rejection' : 'general'
      await (supabase.from('sample_comments') as any).insert({
        sample_request_id: sampleId,
        comment_type: commentType,
        comment,
        author_role: ctx.role,
        created_by: ctx.userId,
      })
    }

    revalidatePath('/sampling')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function addSampleComment(sampleId: string, data: {
  comment: string
  comment_type?: string
  is_internal?: boolean
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const { error } = await (supabase.from('sample_comments') as any).insert({
      sample_request_id: sampleId,
      comment_type: data.comment_type || 'general',
      comment: data.comment,
      author_role: ctx.role,
      is_internal: data.is_internal || false,
      created_by: ctx.userId,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/sampling')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function addSampleMeasurement(sampleId: string, data: {
  size: string
  point_of_measure: string
  spec_value: number
  actual_value?: number
  tolerance_plus?: number
  tolerance_minus?: number
  unit?: string
  revision_number?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const actual = data.actual_value
    const spec = data.spec_value
    const tolPlus = data.tolerance_plus ?? 0.5
    const tolMinus = data.tolerance_minus ?? 0.5
    let status: 'pass' | 'fail' | 'pending' = 'pending'
    if (actual != null) {
      status = (actual >= spec - tolMinus && actual <= spec + tolPlus) ? 'pass' : 'fail'
    }

    const { error } = await (supabase.from('sample_measurements') as any).insert({
      sample_request_id: sampleId,
      size: data.size,
      point_of_measure: data.point_of_measure,
      spec_value: spec,
      actual_value: actual ?? null,
      tolerance_plus: tolPlus,
      tolerance_minus: tolMinus,
      status,
      unit: data.unit || 'inches',
      revision_number: data.revision_number || 1,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath('/sampling')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
