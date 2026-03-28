'use server'

import { revalidatePath } from 'next/cache'
import { getConsoleContext } from '@/lib/console/getConsoleContext'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/types/database'

export async function changeUserRole(userId: string, newRole: UserRole) {
  await getConsoleContext()
  const admin = createAdminClient()

  const { error } = await (admin
    .from('profiles') as any)
    .update({ role: newRole })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/console/users')
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await getConsoleContext()
  const admin = createAdminClient()

  const { error } = await (admin
    .from('profiles') as any)
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/console/users')
}
