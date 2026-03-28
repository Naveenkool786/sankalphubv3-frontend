'use server'

import { revalidatePath } from 'next/cache'
import { getConsoleContext } from '@/lib/console/getConsoleContext'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_CONFIG, type PlanSlug } from '@/lib/plans'

export async function changePlan(orgId: string, newPlan: PlanSlug) {
  await getConsoleContext()
  const admin = createAdminClient()
  const config = PLAN_CONFIG[newPlan]

  const updateData: Record<string, unknown> = {
    plan: newPlan,
    max_users: config.maxUsers,
  }

  if (newPlan === 'trial') {
    updateData.trial_start = new Date().toISOString()
    updateData.trial_end = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
    updateData.is_trial_locked = false
  }

  const { error } = await (admin
    .from('organizations') as any)
    .update(updateData)
    .eq('id', orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/console/organizations')
  revalidatePath('/console')
}

export async function toggleOrgActive(orgId: string, isActive: boolean) {
  await getConsoleContext()
  const admin = createAdminClient()

  const { error } = await (admin
    .from('organizations') as any)
    .update({ is_active: isActive })
    .eq('id', orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/console/organizations')
  revalidatePath('/console')
}
