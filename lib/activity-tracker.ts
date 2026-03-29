import { createAdminClient } from '@/lib/supabase/admin'

interface TrackEventParams {
  userId: string
  organizationId: string
  actionType: string
  category: string
  actionLabel: string
  detail?: string
  metadata?: Record<string, unknown>
  pagePath?: string
  fromPath?: string
}

/**
 * Log a user action to the activity_log table.
 * Uses the service role client — never the user's client.
 * Never throws — tracking must never break the user's action.
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const supabase = createAdminClient()
    await (supabase.from('activity_log') as any).insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      action_type: params.actionType,
      category: params.category,
      action_label: params.actionLabel,
      detail: params.detail ?? null,
      metadata: params.metadata ?? null,
      page_path: params.pagePath ?? null,
      from_path: params.fromPath ?? null,
    })
  } catch (err) {
    console.error('[ActivityTracker] Failed to log event:', err)
  }
}
