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

/* ─── Subscription Tiers (Normal pricing — Free / Pro / Enterprise) ─── */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface SubscriptionTierConfig {
  name: string
  priceUsd: number            // 0 = free or custom
  annualPriceUsd: number      // 0 = N/A
  isCustom: boolean           // Enterprise = contact sales
  trialDays: number           // 0 = no trial
  maxUsers: number            // -1 = unlimited
  maxInspectionsPerMonth: number  // -1 = unlimited
  maxProjects: number             // -1 = unlimited
  maxTemplates: number            // -1 = unlimited
  storageLabel: string
  maxAiGensPerMonth: number       // -1 = unlimited
  features: string[]
  missingFeatures: string[]       // features NOT included (shown as ✗)
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  free: {
    name: 'Free',
    priceUsd: 0,
    annualPriceUsd: 0,
    isCustom: false,
    trialDays: 21,
    maxUsers: 5,
    maxInspectionsPerMonth: 10,
    maxProjects: 5,
    maxTemplates: 3,
    storageLabel: '500 MB',
    maxAiGensPerMonth: 3,
    features: [
      'Up to 5 users',
      '10 inspections / month',
      '5 active projects',
      '3 templates',
      '3 AI generations / month',
      'AQL scoring engine',
      'Defect capture + photos',
      '500 MB storage',
    ],
    missingFeatures: [
      'PDF reports',
      'Excel export',
      'Multi-factory support',
      'Audit logs',
    ],
  },
  pro: {
    name: 'Pro',
    priceUsd: 29,
    annualPriceUsd: 278,
    isCustom: false,
    trialDays: 14,
    maxUsers: 5,
    maxInspectionsPerMonth: -1,
    maxProjects: -1,
    maxTemplates: -1,
    storageLabel: '15 GB',
    maxAiGensPerMonth: -1,
    features: [
      'Up to 5 users per org',
      'Unlimited inspections',
      'Unlimited projects',
      'Unlimited templates',
      'Unlimited AI generations',
      'PDF reports & Excel export',
      'Multi-factory support',
      'Audit logs (90 days)',
      '15 GB storage',
      'Email delivery',
      'Priority support',
    ],
    missingFeatures: [
      'White-label',
      'SSO / SAML',
      'API access',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceUsd: 0,
    annualPriceUsd: 0,
    isCustom: true,
    trialDays: 30,
    maxUsers: -1,
    maxInspectionsPerMonth: -1,
    maxProjects: -1,
    maxTemplates: -1,
    storageLabel: '100 GB+',
    maxAiGensPerMonth: -1,
    features: [
      'Unlimited users',
      'Unlimited everything',
      'White-label branding',
      'SSO / SAML',
      'API access',
      'Audit logs (unlimited)',
      '100 GB+ storage',
      'Dedicated account manager',
      'On-site onboarding',
      'SLA 99.9%',
      'Custom integrations',
    ],
    missingFeatures: [],
  },
}

export function getSubscriptionTier(tier: string): SubscriptionTierConfig {
  return SUBSCRIPTION_TIERS[tier as SubscriptionTier] ?? SUBSCRIPTION_TIERS.free
}
