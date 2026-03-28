import { getUserContext } from '@/lib/getUserContext'
import { createClient } from '@/lib/supabase/server'
import { getPlanDisplayName } from '@/lib/plans'
import { Badge } from '@/components/ui/badge'
import { CreditCard } from 'lucide-react'

export default async function BillingSettingsPage() {
  const ctx = await getUserContext()
  const supabase = await createClient()

  const { data: org } = await (supabase.from('organizations') as any)
    .select('plan, max_users, trial_end')
    .eq('id', ctx.orgId)
    .single()

  const plan = org?.plan ?? 'free'
  const planName = getPlanDisplayName(plan)

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" /> Billing
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your plan, seats, and usage
      </p>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Current Plan:</span>
          <Badge variant="secondary" className="text-xs" style={{ backgroundColor: 'rgba(201,169,110,0.15)', color: '#C9A96E' }}>
            {planName}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Max Users:</span>
          <span className="text-sm font-medium text-foreground">{org?.max_users ?? '—'}</span>
        </div>
        {org?.trial_end && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Trial Ends:</span>
            <span className="text-sm font-medium text-foreground">
              {new Date(org.trial_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
