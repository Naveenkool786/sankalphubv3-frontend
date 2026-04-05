'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { trackEvent } from '@/lib/activity-tracker'
import { createNotification } from '@/lib/notifications'
import type { InspectionStatus, InspectionType } from '@/types/database'

export async function createInspection(data: {
  project_id: string | null
  factory_id: string | null
  inspection_type: InspectionType
  inspection_date: string
  auditor_name: string
  aql_level: string
  quantity_inspected: number
  sample_size: number
  template_id: string | null
  template_name: string | null
  remarks: string
}) {
  const ctx = await getUserContext()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : await createClient()
  const inspection_no = `INS-${Date.now()}`

  const { error } = await supabase.from('inspections').insert({
    org_id: ctx.orgId,
    inspection_no,
    inspection_type: data.inspection_type,
    aql_level: data.aql_level || 'AQL 2.5',
    status: 'draft' as InspectionStatus,
    result: 'pending',
    inspection_date: data.inspection_date,
    quantity_inspected: data.quantity_inspected,
    sample_size: data.sample_size,
    defects_found: 0,
    critical_defects: 0,
    major_defects: 0,
    minor_defects: 0,
    project_id: data.project_id || null,
    factory_id: data.factory_id || null,
    auditor_name: data.auditor_name || null,
    template_id: data.template_id || null,
    template_name: data.template_name || null,
    remarks: data.remarks || null,
    created_by: ctx.userId,
  } as any)

  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'inspection_start', category: 'inspections', actionLabel: 'Started inspection', detail: `${inspection_no} · ${data.inspection_type} · AQL ${data.aql_level} · Sample: ${data.sample_size}` })
  createNotification({ organizationId: ctx.orgId, eventType: 'inspection_scheduled', soundCategory: 'brand', title: 'Inspection started', detail: `${inspection_no} · ${data.inspection_type} · AQL ${data.aql_level}`, link: '/inspections' })
  revalidatePath('/inspections')
}

export async function notifyInspectionResult(data: {
  inspectionId: string
  inspectionNo: string
  result: 'pass' | 'fail'
  hasCriticalDefects: boolean
}) {
  const ctx = await getUserContext()

  if (data.result === 'pass') {
    await createNotification({
      organizationId: ctx.orgId,
      eventType: 'inspection_passed',
      soundCategory: 'inspection_pass',
      title: 'Inspection Passed',
      detail: `${data.inspectionNo} passed AQL requirements`,
      link: `/inspections`,
      isCritical: false,
    })
  } else {
    await createNotification({
      organizationId: ctx.orgId,
      eventType: 'inspection_failed',
      soundCategory: 'inspection_fail',
      title: 'Inspection Failed',
      detail: `${data.inspectionNo} failed AQL requirements`,
      link: `/inspections`,
      isCritical: true,
    })
  }

  if (data.hasCriticalDefects) {
    await createNotification({
      organizationId: ctx.orgId,
      eventType: 'critical_defect',
      soundCategory: 'inspection_fail',
      title: 'Critical Defect Found',
      detail: `Critical defect detected during ${data.inspectionNo}`,
      link: `/inspections`,
      isCritical: true,
    })
  }
}

export async function updateInspectionStatus(inspectionId: string, status: InspectionStatus) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : await createClient()
  const { error } = await (supabase.from('inspections') as any)
    .update({ status })
    .eq('id', inspectionId)
    .eq('org_id', ctx.orgId)
  if (error) throw new Error(error.message)
  revalidatePath('/inspections')
}

export async function deleteInspection(inspectionId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = serviceKey
    ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : await createClient()
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId)
    .eq('org_id', ctx.orgId)
  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'delete', category: 'inspections', actionLabel: 'Deleted inspection', detail: inspectionId })
  revalidatePath('/inspections')
}
