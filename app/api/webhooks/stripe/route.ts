import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const orgId = session.metadata?.org_id
      if (!orgId) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      const priceId = subscription.items.data[0]?.price.id

      // Map price ID to plan
      const planMap: Record<string, { plan: string; maxUsers: number }> = {
        [process.env.STRIPE_PRICE_STARTER_MONTHLY || '']: { plan: 'starter', maxUsers: 10 },
        [process.env.STRIPE_PRICE_STARTER_ANNUAL || '']: { plan: 'starter', maxUsers: 10 },
        [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '']: { plan: 'professional', maxUsers: 50 },
        [process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || '']: { plan: 'professional', maxUsers: 50 },
      }

      const planInfo = planMap[priceId] || { plan: 'starter', maxUsers: 10 }

      await (supabase.from('organizations') as any).update({
        plan: planInfo.plan,
        max_users: planInfo.maxUsers,
        stripe_subscription_id: session.subscription,
        is_trial_locked: false,
        plan_changed_at: new Date().toISOString(),
      }).eq('id', orgId)

      await createNotification({
        organizationId: orgId,
        eventType: 'plan_upgraded',
        soundCategory: 'brand',
        title: 'Plan Upgraded',
        detail: `Your organization has been upgraded to ${planInfo.plan}`,
        link: '/settings/billing',
        isCritical: false,
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as any
      if (subscription.cancel_at_period_end) {
        // User scheduled cancellation
        const { data: orgs } = await (supabase.from('organizations') as any)
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1)
        if (orgs?.[0]) {
          await (supabase.from('organizations') as any).update({
            cancel_at_period_end: true,
          }).eq('id', orgs[0].id)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any
      const { data: orgs } = await (supabase.from('organizations') as any)
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .limit(1)
      if (orgs?.[0]) {
        await (supabase.from('organizations') as any).update({
          plan: 'free',
          max_users: 1,
          stripe_subscription_id: null,
          cancel_at_period_end: false,
        }).eq('id', orgs[0].id)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any
      const customerId = invoice.customer as string
      const { data: orgs } = await (supabase.from('organizations') as any)
        .select('id')
        .eq('stripe_customer_id', customerId)
        .limit(1)
      if (orgs?.[0]) {
        await createNotification({
          organizationId: orgs[0].id,
          eventType: 'plan_upgraded',
          soundCategory: 'system',
          title: 'Payment Failed',
          detail: 'Your latest payment was unsuccessful. Please update your payment method.',
          link: '/settings/billing',
          isCritical: true,
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
