import { createAdminClient } from '@/lib/supabase/admin'

interface CreateNotificationParams {
  organizationId: string
  userId?: string
  eventType: string
  soundCategory: 'brand' | 'factory' | 'inspection_pass' | 'inspection_fail' | 'system' | 'audit_complete' | 'deadline_warning' | 'production_milestone' | 'urgent_action'
  title: string
  detail?: string
  link?: string
  isCritical?: boolean
}

/**
 * Write a notification to the notifications table.
 * Uses service role client — never the user's client.
 * Never throws — notification failure must never break the main action.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const supabase = createAdminClient()
    await (supabase.from('notifications') as any).insert({
      org_id: params.organizationId,
      user_id: params.userId ?? null,
      event_type: params.eventType,
      sound_category: params.soundCategory,
      title: params.title,
      detail: params.detail ?? null,
      link: params.link ?? null,
      is_critical: params.isCritical ?? false,
      is_read: false,
    })
  } catch (err) {
    console.error('[Notifications] Failed to create notification:', err)
  }
}
