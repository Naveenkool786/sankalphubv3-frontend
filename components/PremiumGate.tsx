import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/getUserContext'
import { isPremiumPlan, getPlanDisplayName } from '@/lib/plans'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
  /** Display name for the feature being gated, e.g. "Analytics" */
  feature?: string
}

/**
 * Server component. Renders children if the org is on a premium plan.
 * Shows an upgrade wall otherwise.
 */
export async function PremiumGate({ children, feature = 'This feature' }: Props) {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', ctx.orgId)
    .single()

  const plan = (org as any)?.plan ?? 'free'

  if (isPremiumPlan(plan)) {
    return <>{children}</>
  }

  const planName = getPlanDisplayName(plan)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 py-16">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto"
        style={{ backgroundColor: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.25)' }}
      >
        <Lock className="w-7 h-7" style={{ color: '#C9A96E' }} />
      </div>

      {/* Label */}
      <p
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: '#C9A96E' }}
      >
        PremiumHub Required
      </p>

      {/* Headline */}
      <h2 className="text-2xl font-bold text-foreground mb-3">
        {feature} is a PremiumHub feature
      </h2>

      {/* Body */}
      <p className="text-muted-foreground mb-8 max-w-sm text-sm leading-relaxed">
        Your organisation is on the <strong className="text-foreground">{planName}</strong> plan.
        Upgrade to PremiumHub to unlock{' '}
        <strong className="text-foreground">Analytics</strong>,{' '}
        <strong className="text-foreground">Live Dashboard</strong>,{' '}
        <strong className="text-foreground">Templates Builder</strong>, and more.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          asChild
          style={{ backgroundColor: '#A87C30' }}
          className="hover:opacity-90 font-semibold"
        >
          <Link href="/pricing">View PremiumHub Plans →</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/demo">Talk to Sales</Link>
        </Button>
      </div>
    </div>
  )
}
