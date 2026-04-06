'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { trackEvent } from '@/lib/activity-tracker'
import { createNotification } from '@/lib/notifications'
import type { ProjectStatus } from '@/types/database'

export async function createProject(data: {
  name: string
  product_category: string
  factory_id: string | null
  quantity: number
  unit: string
  deadline: string
  country: string
  po_number: string
  notes: string
}) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('projects') as any).insert({
    org_id: ctx.orgId,
    name: data.name,
    product_category: data.product_category || null,
    factory_id: data.factory_id || null,
    quantity: data.quantity,
    unit: data.unit || null,
    deadline: data.deadline,
    country: data.country || null,
    po_number: data.po_number || null,
    notes: data.notes || null,
    status: 'draft' as ProjectStatus,
    created_by: ctx.userId,
  })
  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'create', category: 'projects', actionLabel: 'Created project', detail: `${data.name} · ${data.product_category || 'No category'} · Qty: ${data.quantity}` })
  createNotification({ organizationId: ctx.orgId, eventType: 'order_assigned', soundCategory: 'brand', title: 'New project created', detail: `${data.name} · ${data.product_category || 'General'}`, link: '/projects' })
  revalidatePath('/projects')
}

export async function updateProject(
  projectId: string,
  data: {
    name: string
    product_category: string
    factory_id: string | null
    quantity: number
    unit: string
    deadline: string
    country: string
    po_number: string
    notes: string
  }
) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('projects') as any)
    .update({
      name: data.name,
      product_category: data.product_category || null,
      factory_id: data.factory_id || null,
      quantity: data.quantity,
      unit: data.unit || null,
      deadline: data.deadline,
      country: data.country || null,
      po_number: data.po_number || null,
      notes: data.notes || null,
    })
    .eq('id', projectId)
    .eq('org_id', ctx.orgId)
  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'edit', category: 'projects', actionLabel: 'Updated project', detail: data.name })
  revalidatePath('/projects')
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('projects') as any)
    .update({ status })
    .eq('id', projectId)
    .eq('org_id', ctx.orgId)
  if (error) throw new Error(error.message)
  revalidatePath('/projects')
}

export async function createFullProject(data: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getUserContext()
    if (!canManage(ctx.role)) return { success: false, error: 'Unauthorized — only admins can create projects' }

    // Whitelist known columns — try with all fields, retry without optional ones on schema error
    const supabase = createAdminClient()
    const corePayload: Record<string, any> = {
      org_id: ctx.orgId,
      created_by: ctx.userId,
      name: data.name,
      season: data.season || null,
      product_category: data.product_category || null,
      product_type: data.product_type || null,
      description: data.description || null,
      product_image_url: data.product_image_url || null,
      factory_id: data.factory_id || null,
      po_number: data.po_number || null,
      quantity: data.quantity || null,
      unit: data.unit || 'pcs',
      country: data.country || null,
      sizes: data.sizes || null,
      start_date: data.start_date || null,
      expected_delivery: data.expected_delivery || null,
      deadline: data.deadline || null,
      inspection_date: data.inspection_date || null,
      shipment_date: data.shipment_date || null,
      aql_level: data.aql_level || null,
      inspection_type: data.inspection_type || null,
      sample_size: data.sample_size || null,
      lot_size: data.lot_size || null,
      priority: data.priority || 'medium',
      notes: data.notes || null,
      status: data.status || 'draft',
    }

    // Optional columns that may not exist yet in the DB
    const optionalFields: Record<string, any> = {
      buyer_brand: data.buyer_brand || null,
    }

    // Try with all fields first
    let { error } = await (supabase.from('projects') as any).insert({ ...corePayload, ...optionalFields })

    // If a column doesn't exist, retry without optional fields
    if (error?.message?.includes('schema cache') || error?.message?.includes('column')) {
      const retryResult = await (supabase.from('projects') as any).insert(corePayload)
      error = retryResult.error
    }

    if (error) return { success: false, error: error.message }
    trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'create', category: 'projects', actionLabel: 'Created project (wizard)', detail: `${data.name} · ${data.product_category || 'General'}` })
    createNotification({ organizationId: ctx.orgId, eventType: 'order_assigned', soundCategory: 'brand', title: 'New project created', detail: `${data.name} · ${data.product_category || 'General'}`, link: '/projects' })
    revalidatePath('/projects')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error creating project' }
  }
}

export async function deleteProject(projectId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('projects') as any)
    .delete()
    .eq('id', projectId)
    .eq('org_id', ctx.orgId)
  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'delete', category: 'projects', actionLabel: 'Deleted project', detail: projectId })
  revalidatePath('/projects')
}
