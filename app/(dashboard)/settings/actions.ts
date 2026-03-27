'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserContext, canManage } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'

export async function updateProfile(data: { full_name: string; department?: string; phone?: string }) {
  const ctx = await getUserContext()
  if (!data.full_name.trim()) throw new Error('Display name is required')

  const supabase = await createClient()
  const { error } = await (supabase.from('profiles') as any)
    .update({
      full_name: data.full_name.trim(),
      department: data.department?.trim() || null,
      phone: data.phone?.trim() || null,
    })
    .eq('id', ctx.userId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}

export async function updateOrganization(data: { name: string }) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')
  if (!data.name.trim()) throw new Error('Organization name is required')

  const supabase = await createClient()
  const { error } = await (supabase.from('organizations') as any)
    .update({ name: data.name.trim() })
    .eq('id', ctx.orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/settings')
}
