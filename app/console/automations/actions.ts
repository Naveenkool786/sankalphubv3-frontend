'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Load saved automation states from the console_automations table.
 * Returns a Record<stepId, boolean> or empty object if table doesn't exist.
 */
export async function loadAutomationStates(): Promise<Record<string, boolean>> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await (supabase.from('console_automations') as any)
      .select('step_id, is_enabled')

    if (error) return {}
    const result: Record<string, boolean> = {}
    for (const row of (data ?? []) as any[]) {
      result[row.step_id] = row.is_enabled ?? false
    }
    return result
  } catch {
    return {}
  }
}

/**
 * Toggle an automation step's enabled state.
 * Upserts into console_automations table.
 */
export async function toggleAutomation(stepId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await (supabase.from('console_automations') as any).upsert(
      { step_id: stepId, is_enabled: enabled, updated_at: new Date().toISOString() },
      { onConflict: 'step_id' }
    )
    if (error) return { success: false, error: error.message }
    revalidatePath('/console/automations')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save' }
  }
}
