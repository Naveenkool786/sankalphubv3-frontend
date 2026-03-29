'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getConsoleContext } from '@/lib/console/getConsoleContext'

export async function startImpersonationSession(
  targetUserId: string,
  targetUserEmail: string,
  targetUserName: string,
  targetOrgName: string,
): Promise<string> {
  const ctx = await getConsoleContext()
  const supabase = createAdminClient()

  const { data, error } = await (supabase.from('impersonation_sessions') as any)
    .insert({
      impersonator_id: ctx.userId,
      target_user_id: targetUserId,
      target_user_email: targetUserEmail,
      target_user_name: targetUserName,
      target_org_name: targetOrgName,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function endImpersonationSession(sessionId: string): Promise<void> {
  await getConsoleContext()
  const supabase = createAdminClient()
  const now = new Date()

  const { data: session } = await (supabase.from('impersonation_sessions') as any)
    .select('started_at')
    .eq('id', sessionId)
    .single()

  const duration = session
    ? Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000)
    : null

  await (supabase.from('impersonation_sessions') as any)
    .update({ ended_at: now.toISOString(), duration_seconds: duration })
    .eq('id', sessionId)
}

export async function getUserActivity(userId: string, filterType?: string) {
  await getConsoleContext()
  const supabase = createAdminClient()

  let query = (supabase.from('activity_log') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filterType && filterType !== 'all') {
    query = query.eq('action_type', filterType)
  }

  const { data } = await query
  return data ?? []
}

export async function getUserActivityStats(userId: string) {
  await getConsoleContext()
  const supabase = createAdminClient()

  const [total, logins, inspections, deletions] = await Promise.all([
    (supabase.from('activity_log') as any).select('id', { count: 'exact', head: true }).eq('user_id', userId),
    (supabase.from('activity_log') as any).select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('action_type', 'login'),
    (supabase.from('activity_log') as any).select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('category', 'inspections'),
    (supabase.from('activity_log') as any).select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('action_type', 'delete'),
  ])

  return {
    totalActions: total.count ?? 0,
    sessions: logins.count ?? 0,
    inspections: inspections.count ?? 0,
    deletions: deletions.count ?? 0,
  }
}
