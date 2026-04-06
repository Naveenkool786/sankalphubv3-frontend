import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await (admin.from('profiles') as any).select('org_id').eq('id', user.id).single()
    const { data: org } = await (admin.from('organizations') as any).select('stripe_customer_id').eq('id', profile?.org_id).single()

    if (!org?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account. Subscribe to a plan first.' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${req.nextUrl.origin}/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
