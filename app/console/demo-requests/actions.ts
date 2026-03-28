'use server'

import { revalidatePath } from 'next/cache'
import { getConsoleContext } from '@/lib/console/getConsoleContext'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateDemoStatus(requestId: string, status: 'new' | 'contacted' | 'converted') {
  await getConsoleContext()
  const admin = createAdminClient()

  // Get existing metadata
  const { data: existing } = await (admin
    .from('demo_requests') as any)
    .select('metadata')
    .eq('id', requestId)
    .single()

  const metadata = (existing?.metadata as Record<string, unknown>) ?? {}

  const { error } = await (admin
    .from('demo_requests') as any)
    .update({ metadata: { ...metadata, status } })
    .eq('id', requestId)

  if (error) throw new Error(error.message)
  revalidatePath('/console/demo-requests')
  revalidatePath('/console')
}
