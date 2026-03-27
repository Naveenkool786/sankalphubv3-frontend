'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserContext, canManage } from '@/lib/getUserContext'
import type { UserRole } from '@/lib/getUserContext'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export async function inviteUser(email: string, role: UserRole) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const adminClient = createAdminClient()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') ?? ''

  const { data: userData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?type=invite`,
  })
  if (inviteError) throw new Error(inviteError.message)

  const userId = userData.user.id
  const inviteToken = randomUUID()

  await (adminClient.from('profiles') as any).update({
    org_id: ctx.orgId,
    role,
    invite_token: inviteToken,
    invited_by: ctx.userId,
  }).eq('id', userId)

  revalidatePath('/users')
  return { token: inviteToken, userId }
}

export async function removeUser(userId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')
  if (userId === ctx.userId) throw new Error('Cannot remove yourself')

  const supabase = await createClient()
  const { error } = await (supabase.from('profiles') as any)
    .update({ org_id: null, role: 'viewer', invite_token: null })
    .eq('id', userId)
    .eq('org_id', ctx.orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/users')
}

export async function updateUserRole(userId: string, role: UserRole) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')
  if (userId === ctx.userId) throw new Error('Cannot change your own role here')

  const supabase = await createClient()
  const { error } = await (supabase.from('profiles') as any)
    .update({ role })
    .eq('id', userId)
    .eq('org_id', ctx.orgId)

  if (error) throw new Error(error.message)
  revalidatePath('/users')
}

export async function revokeInvite(userId: string) {
  const ctx = await getUserContext()
  if (!canManage(ctx.role)) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await (supabase.from('profiles') as any)
    .update({ org_id: null, invite_token: null })
    .eq('id', userId)
    .eq('org_id', ctx.orgId)
    .is('invite_accepted_at', null)

  if (error) throw new Error(error.message)
  revalidatePath('/users')
}
