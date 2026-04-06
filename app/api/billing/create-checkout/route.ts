import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const PRICE_IDS: Record<string, string> = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
  starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || '',
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
  professional_annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL || '',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { priceKey } = await req.json()
    const priceId = PRICE_IDS[priceKey]
    if (!priceId) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })

    const admin = createAdminClient()
    const { data: profile } = await (admin.from('profiles') as any).select('org_id').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'No organization' }, { status: 400 })

    const { data: org } = await (admin.from('organizations') as any).select('stripe_customer_id, name').eq('id', profile.org_id).single()

    let customerId = org?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: org?.name || undefined,
        metadata: { org_id: profile.org_id, user_id: user.id },
      })
      customerId = customer.id
      await (admin.from('organizations') as any).update({ stripe_customer_id: customerId }).eq('id', profile.org_id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/settings/billing?success=1`,
      cancel_url: `${req.nextUrl.origin}/settings/billing?cancelled=1`,
      metadata: { org_id: profile.org_id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
