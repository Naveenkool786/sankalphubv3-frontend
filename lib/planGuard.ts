import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanConfig } from '@/lib/plans'

export interface SeatStatus {
  plan: string
  planName: string
  current: number       // active members right now
  max: number           // base seat limit for this plan
  atLimit: boolean      // current >= max
  isDomainLocked: boolean
  orgDomain: string | null
  extraSeatCostUsd: number
}

export interface InviteCheckResult {
  allowed: boolean
  reason?: string
  isOverage?: boolean          // Enterprise only: allowed but costs extra
  overbookCostUsd?: number     // how much extra per month
}

/**
 * Returns current seat usage for an organisation.
 * Used by the Users page to display the seat bar.
 */
export async function getOrgSeatStatus(orgId: string): Promise<SeatStatus> {
  const admin = createAdminClient()

  const { data: org } = await admin
    .from('organizations')
    .select('plan, max_users, org_domain')
    .eq('id', orgId)
    .single()

  const plan = (org as any)?.plan ?? 'free'
  const config = getPlanConfig(plan)
  const max = (org as any)?.max_users ?? config.maxUsers

  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_active', true)

  const current = count ?? 0

  return {
    plan,
    planName: config.name,
    current,
    max,
    atLimit: current >= max,
    isDomainLocked: config.isDomainLocked,
    orgDomain: (org as any)?.org_domain ?? null,
    extraSeatCostUsd: config.extraSeatCostUsd,
  }
}

/**
 * Validates whether a new user can be invited to an organisation.
 * Enforces:
 *   - Hard seat caps (Single, Group, free)
 *   - Domain restriction for Group plan (only same-domain emails allowed)
 *   - Overage billing notification for Enterprise (allowed but costs extra)
 */
export async function checkInviteAllowed(
  orgId: string,
  inviteEmail: string,
): Promise<InviteCheckResult> {
  const admin = createAdminClient()

  const { data: org } = await admin
    .from('organizations')
    .select('plan, max_users, org_domain')
    .eq('id', orgId)
    .single()

  if (!org) return { allowed: false, reason: 'Organisation not found.' }

  const plan = (org as any).plan ?? 'free'
  const config = getPlanConfig(plan)
  const max = (org as any).max_users ?? config.maxUsers
  const orgDomain: string | null = (org as any).org_domain ?? null

  // ── Domain restriction (PremiumHub Group) ──────────────────────────────────
  if (config.isDomainLocked && orgDomain) {
    const inviteDomain = inviteEmail.split('@')[1]?.toLowerCase() ?? ''
    if (inviteDomain !== orgDomain.toLowerCase()) {
      return {
        allowed: false,
        reason:
          `This organisation is domain-restricted to @${orgDomain}. ` +
          `Only users with an @${orgDomain} email address can be invited on the ${config.name} plan.`,
      }
    }
  }

  // ── Count current active seats ─────────────────────────────────────────────
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_active', true)

  const current = count ?? 0

  if (current < max) {
    // Under the base limit — always allowed
    return { allowed: true }
  }

  // At or over the base limit
  if (config.extraSeatCostUsd > 0) {
    // Enterprise: overage is allowed, user is billed per extra seat
    return {
      allowed: true,
      isOverage: true,
      overbookCostUsd: config.extraSeatCostUsd,
    }
  }

  // Hard cap for all other plans
  const upgradeHint =
    plan === 'premium_group'
      ? 'Upgrade to PremiumHub Enterprise to add more than 5 users.'
      : plan === 'premium_single'
      ? 'Upgrade to PremiumHub Group (5 users) or Enterprise (11+ users).'
      : 'Upgrade your plan to add more members.'

  return {
    allowed: false,
    reason: `Seat limit reached (${current}/${max} users on ${config.name}). ${upgradeHint}`,
  }
}
