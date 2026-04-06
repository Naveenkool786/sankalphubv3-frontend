import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()

  // Find trial orgs
  const { data: trialOrgs } = await (supabase.from('organizations') as any)
    .select('id, name, trial_end, is_trial_locked')
    .eq('plan', 'trial')
    .not('trial_end', 'is', null)

  if (!trialOrgs) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const org of trialOrgs as any[]) {
    const trialEnd = new Date(org.trial_end)
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (86400000))

    // 7 days left — warning
    if (daysLeft === 7) {
      await createNotification({
        organizationId: org.id,
        eventType: 'trial_expiring',
        soundCategory: 'system',
        title: 'Trial expires in 7 days',
        detail: 'Upgrade to keep all your data and features.',
        link: '/settings/billing',
        isCritical: false,
      })
      processed++
    }

    // 3 days left — warning
    if (daysLeft === 3) {
      await createNotification({
        organizationId: org.id,
        eventType: 'trial_expiring',
        soundCategory: 'system',
        title: 'Trial expires in 3 days',
        detail: 'Upgrade now to avoid losing access to premium features.',
        link: '/settings/billing',
        isCritical: true,
      })
      processed++
    }

    // 1 day left — urgent
    if (daysLeft === 1) {
      await createNotification({
        organizationId: org.id,
        eventType: 'trial_expiring',
        soundCategory: 'system',
        title: 'Trial expires tomorrow',
        detail: 'Your trial ends tomorrow. Upgrade to continue.',
        link: '/settings/billing',
        isCritical: true,
      })
      processed++
    }

    // Expired — lock
    if (daysLeft <= 0 && !org.is_trial_locked) {
      await (supabase.from('organizations') as any).update({
        is_trial_locked: true,
        plan: 'free',
        max_users: 1,
      }).eq('id', org.id)

      await createNotification({
        organizationId: org.id,
        eventType: 'trial_expiring',
        soundCategory: 'system',
        title: 'Trial expired',
        detail: 'Your trial has ended. Upgrade to restore full access.',
        link: '/settings/billing',
        isCritical: true,
      })
      processed++
    }
  }

  return NextResponse.json({ processed, checked: trialOrgs.length })
}
