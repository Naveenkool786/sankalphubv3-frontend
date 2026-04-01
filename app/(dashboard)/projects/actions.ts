'use server'

import { createClient } from '@/lib/supabase/server'
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

  const supabase = await createClient()
  const { error } = await supabase.from('projects').insert({
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
  } as any)
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

  const supabase = await createClient()
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

  const supabase = await createClient()
  const { error } = await (supabase.from('projects') as any)
    .update({ status })
    .eq('id', projectId)
    .eq('org_id', ctx.orgId)
  if (error) throw new Error(error.message)
  revalidatePath('/projects')
}

export async function deleteProject(projectId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('org_id', ctx.orgId)
  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'delete', category: 'projects', actionLabel: 'Deleted project', detail: projectId })
  revalidatePath('/projects')
}
