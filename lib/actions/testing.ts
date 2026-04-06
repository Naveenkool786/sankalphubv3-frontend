'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

function generateRequestNumber(): string {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `TR-${date}-${random}`
}

export async function createTestRequest(data: {
  project_id?: string
  production_order_id?: string
  sample_request_id?: string
  test_category: string
  lab_id?: string
  fabric_type?: string
  fabric_composition?: string
  color?: string
  buyer_standard?: string
  notes?: string
  tests?: { test_name: string; test_method: string; test_parameter: string; required_value: string; unit: string }[]
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const ctx = await getUserContext()
    const supabase = createAdminClient()

    const { data: req, error } = await (supabase.from('test_requests') as any).insert({
      project_id: data.project_id || null,
      production_order_id: data.production_order_id || null,
      sample_request_id: data.sample_request_id || null,
      request_number: generateRequestNumber(),
      lab_id: data.lab_id || null,
      test_category: data.test_category,
      fabric_type: data.fabric_type || null,
      fabric_composition: data.fabric_composition || null,
      color: data.color || null,
      buyer_standard: data.buyer_standard || null,
      status: 'draft',
      notes: data.notes || null,
      created_by: ctx.userId,
    }).select().single()

    if (error) return { success: false, error: error.message }

    // Insert individual test rows from template
    if (data.tests && data.tests.length > 0) {
      await (supabase.from('test_results') as any).insert(
        data.tests.map(t => ({
          test_request_id: req.id,
          test_name: t.test_name,
          test_method: t.test_method,
          test_parameter: t.test_parameter,
          required_value: t.required_value,
          unit: t.unit,
          result: 'pending',
        }))
      )
    }

    revalidatePath('/testing')
    return { success: true, id: req.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function updateTestRequestStatus(requestId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const update: Record<string, any> = { status, updated_at: new Date().toISOString() }
    if (status === 'submitted_to_lab') update.submitted_date = format(new Date(), 'yyyy-MM-dd')
    if (status === 'results_received') update.actual_result_date = format(new Date(), 'yyyy-MM-dd')

    const { error } = await (supabase.from('test_requests') as any).update(update).eq('id', requestId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/testing')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function saveTestResults(requestId: string, results: { id: string; actual_value: string; grade: string; result: string }[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    for (const r of results) {
      await (supabase.from('test_results') as any).update({
        actual_value: r.actual_value || null,
        grade: r.grade || null,
        result: r.result || 'pending',
      }).eq('id', r.id)
    }

    // Auto-calculate overall result
    const { data: allResults } = await (supabase.from('test_results') as any).select('result').eq('test_request_id', requestId)
    const rated = (allResults ?? []).filter((r: any) => r.result !== 'pending' && r.result !== 'not_applicable')
    const failCount = rated.filter((r: any) => r.result === 'fail').length
    const overall = rated.length === 0 ? null : failCount === 0 ? 'pass' : 'fail'

    if (overall) {
      await (supabase.from('test_requests') as any).update({
        overall_result: overall,
        status: overall,
        updated_at: new Date().toISOString(),
      }).eq('id', requestId)
    }

    revalidatePath('/testing')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}

export async function createLabPartner(data: {
  lab_name: string; lab_code?: string; accreditation?: string
  country?: string; city?: string; contact_name?: string
  contact_email?: string; contact_phone?: string
  specializations?: string[]; turnaround_days?: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await (supabase.from('lab_partners') as any).insert({
      lab_name: data.lab_name,
      lab_code: data.lab_code || null,
      accreditation: data.accreditation || null,
      country: data.country || null,
      city: data.city || null,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      specializations: data.specializations || null,
      turnaround_days: data.turnaround_days || 7,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/testing/labs')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' }
  }
}
