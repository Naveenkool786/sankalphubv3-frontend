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

    // Build payload dynamically — try insert, strip failing columns on schema errors
    const supabase = createAdminClient()
    const payload: Record<string, any> = {
      org_id: ctx.orgId,
      created_by: ctx.userId,
      name: data.name,
      product_name: data.product_name || data.name,
      status: data.status || 'draft',
    }

    // Add optional fields — any of these may not exist in the DB yet
    const optionalFields: Record<string, any> = {
      season: data.season, product_category: data.product_category,
      product_type: data.product_type, description: data.description,
      product_image_url: data.product_image_url, factory_id: data.factory_id,
      po_number: data.po_number, quantity: data.quantity, unit: data.unit || 'pcs',
      country: data.country, buyer_brand: data.buyer_brand, sizes: data.sizes,
      start_date: data.start_date, expected_delivery: data.expected_delivery,
      deadline: data.deadline, inspection_date: data.inspection_date,
      shipment_date: data.shipment_date, aql_level: data.aql_level,
      inspection_type: data.inspection_type, sample_size: data.sample_size,
      lot_size: data.lot_size, priority: data.priority || 'medium',
      notes: data.notes,
    }

    // Only include non-null optional fields
    for (const [k, v] of Object.entries(optionalFields)) {
      if (v != null && v !== '') payload[k] = v
    }

    // Try insert — if a column doesn't exist, strip it and retry (up to 3 retries)
    let error: any = null
    let attempts = 0
    let currentPayload = { ...payload }

    while (attempts < 4) {
      const result = await (supabase.from('projects') as any).insert(currentPayload)
      error = result.error
      if (!error) break

      // If schema cache error, remove the offending column and retry
      const match = error.message?.match(/Could not find the '(\w+)' column/)
      if (match) {
        delete currentPayload[match[1]]
        attempts++
      } else {
        break
      }
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
