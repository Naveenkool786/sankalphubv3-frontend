export type PlanSlug =
  | 'free'
  | 'trial'
  | 'premium_single'
  | 'premium_group'
  | 'premium_enterprise'
  | 'founding_member'

export interface PlanConfig {
  name: string
  maxUsers: number          // base seat limit
  isPremium: boolean        // unlocks Analytics, Live Dashboard, Templates Builder
  isDomainLocked: boolean   // all users must share the same email domain
  extraSeatCostUsd: number  // cost per seat beyond maxUsers (0 = hard cap, no overage)
}

export const PLAN_CONFIG: Record<PlanSlug, PlanConfig> = {
  free: {
    name: 'Free (Limited)',
    maxUsers: 1,
    isPremium: false,
    isDomainLocked: false,
    extraSeatCostUsd: 0,
  },
  trial: {
    name: '21-Day Trial',
    maxUsers: 20,
    isPremium: true,
    isDomainLocked: false,
    extraSeatCostUsd: 0,
  },
  premium_single: {
    name: 'PremiumHub Single',
    maxUsers: 1,
    isPremium: true,
    isDomainLocked: false,
    extraSeatCostUsd: 0,
  },
  premium_group: {
    name: 'PremiumHub Group',
    maxUsers: 5,
    isPremium: true,
    isDomainLocked: true,   // 6th user with same domain is blocked
    extraSeatCostUsd: 0,   // hard cap — no overage for Group
  },
  premium_enterprise: {
    name: 'PremiumHub Enterprise',
    maxUsers: 11,
    isPremium: true,
    isDomainLocked: false,
    extraSeatCostUsd: 19,  // +$19/month per seat beyond 11
  },
  founding_member: {
    name: 'Founding Member',
    maxUsers: 5,
    isPremium: true,
    isDomainLocked: false,
    extraSeatCostUsd: 0,
  },
}

export function getPlanConfig(plan: string): PlanConfig {
  return PLAN_CONFIG[plan as PlanSlug] ?? PLAN_CONFIG.free
}

export function isPremiumPlan(plan: string): boolean {
  return getPlanConfig(plan).isPremium
}

export function getPlanDisplayName(plan: string): string {
  return getPlanConfig(plan).name
}
