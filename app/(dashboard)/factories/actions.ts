'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { trackEvent } from '@/lib/activity-tracker'

export async function createFactory(data: {
  name: string
  country: string
  city: string
  contact_name: string
  contact_email: string
  contact_phone: string
  code: string
  certifications: string[]
  is_self_registered?: boolean
  website?: string
  notes?: string
  status?: string
  photo_url?: string
  total_lines?: number | null
  max_capacity?: number | null
  categories?: string[]
  aql_default?: string
  inspection_preference?: string
}) {
  const ctx = await getUserContext()
  const supabase = createAdminClient()

  const isActive = data.status === 'inactive' ? false : !data.is_self_registered

  const { error } = await (supabase.from('factories') as any).insert({
    org_id: ctx.orgId,
    name: data.name,
    code: data.code || null,
    country: data.country || null,
    city: data.city || null,
    contact_name: data.contact_name || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    certifications: data.certifications.length > 0 ? data.certifications : null,
    audit_compliance: data.is_self_registered ? { self_registered: true, status: 'pending' } : null,
    is_active: isActive,
    status: data.status || (isActive ? 'active' : 'inactive'),
    website: data.website || null,
    notes: data.notes || null,
    photo_url: data.photo_url || null,
    total_lines: data.total_lines ?? null,
    max_capacity: data.max_capacity ?? null,
    categories: data.categories && data.categories.length > 0 ? data.categories : null,
    aql_default: data.aql_default || null,
    inspection_preference: data.inspection_preference || null,
    created_by: ctx.userId,
  })

  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'create', category: 'factories', actionLabel: 'Added factory', detail: `${data.name} · ${data.country || 'No country'}` })
  revalidatePath('/factories')
}

export async function updateFactory(
  factoryId: string,
  data: {
    name: string
    country: string
    city: string
    address: string
    contact_name: string
    contact_email: string
    contact_phone: string
    code: string
    certifications: string[]
  }
) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('factories') as any)
    .update({
      name: data.name,
      code: data.code || null,
      country: data.country || null,
      city: data.city || null,
      address: data.address || null,
      contact_name: data.contact_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      certifications: data.certifications.length > 0 ? data.certifications : null,
    })
    .eq('id', factoryId)
    .eq('org_id', ctx.orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/factories')
  revalidatePath(`/factories/${factoryId}`)
}

export async function deleteFactory(factoryId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('factories') as any)
    .delete()
    .eq('id', factoryId)
    .eq('org_id', ctx.orgId)

  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'delete', category: 'factories', actionLabel: 'Deleted factory', detail: factoryId })
  revalidatePath('/factories')
}

export async function assignFactoryToProject(factoryId: string, projectId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('projects') as any)
    .update({ factory_id: factoryId })
    .eq('id', projectId)
    .eq('org_id', ctx.orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/projects')
  revalidatePath('/factories')
}

export async function removeFactoryFromProject(projectId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('projects') as any)
    .update({ factory_id: null })
    .eq('id', projectId)
    .eq('org_id', ctx.orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/projects')
  revalidatePath('/factories')
}

export async function updateFactoryStatus(factoryId: string, status: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await (supabase.from('factories') as any)
    .update({ status, is_active: status !== 'inactive' })
    .eq('id', factoryId)
    .eq('org_id', ctx.orgId)
  if (error) throw new Error(error.message)
  trackEvent({ userId: ctx.userId, organizationId: ctx.orgId, actionType: 'edit', category: 'factories', actionLabel: `Factory status → ${status}`, detail: factoryId })
  revalidatePath('/factories')
}
