import { createAdminClient } from '@/lib/supabase/admin'

const PLAN_LIMITS: Record<string, {
  inspections: number
  projects: number
  templates: number
  factories: number
  aiGenerations: number
}> = {
  free: { inspections: 10, projects: 5, templates: 3, factories: 2, aiGenerations: 3 },
  trial: { inspections: 20, projects: 5, templates: 10, factories: 5, aiGenerations: 10 },
  premium_single: { inspections: 100, projects: 25, templates: 50, factories: 10, aiGenerations: 50 },
  premium_group: { inspections: 100, projects: 25, templates: 50, factories: 10, aiGenerations: 50 },
  premium_enterprise: { inspections: Infinity, projects: Infinity, templates: Infinity, factories: Infinity, aiGenerations: Infinity },
  founding_member: { inspections: Infinity, projects: Infinity, templates: Infinity, factories: Infinity, aiGenerations: Infinity },
  starter: { inspections: 100, projects: 25, templates: 50, factories: 10, aiGenerations: 50 },
  professional: { inspections: 500, projects: 100, templates: Infinity, factories: 50, aiGenerations: 200 },
  enterprise: { inspections: Infinity, projects: Infinity, templates: Infinity, factories: Infinity, aiGenerations: Infinity },
}

export type QuotaType = 'inspections' | 'projects' | 'templates' | 'factories' | 'aiGenerations'

export async function checkQuota(orgId: string, plan: string, quotaType: QuotaType): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const limit = limits[quotaType]
  if (limit === Infinity) return { allowed: true, current: 0, limit }

  const supabase = createAdminClient()
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let current = 0
  if (quotaType === 'inspections') {
    const { count } = await (supabase.from('inspections') as any).select('*', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', periodStart)
    current = count ?? 0
  } else if (quotaType === 'projects') {
    const { count } = await (supabase.from('projects') as any).select('*', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', periodStart)
    current = count ?? 0
  } else if (quotaType === 'templates') {
    const { count } = await (supabase.from('inspection_templates') as any).select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_archived', false)
    current = count ?? 0
  } else if (quotaType === 'factories') {
    const { count } = await (supabase.from('factories') as any).select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_active', true)
    current = count ?? 0
  }

  return { allowed: current < limit, current, limit }
}
