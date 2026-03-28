import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'

const schema = z.object({
  org_type: z.enum(['factory', 'brand', 'agency']),
})

const ROLE_MAP: Record<string, string> = {
  factory: 'factory_manager',
  brand: 'brand_manager',
  agency: 'inspector',
}

export async function POST(req: NextRequest) {
  try {
    // Verify authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse request
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid role selection' }, { status: 400 })
    }

    const { org_type } = parsed.data

    // Use service role to bypass RLS for org creation + profile update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const admin = createServiceClient(supabaseUrl, serviceKey)

    // Check if user already has an org
    const { data: existing } = await admin
      .from('profiles')
      .select('org_id, full_name')
      .eq('id', user.id)
      .single()

    if (existing?.org_id) {
      return NextResponse.json({ error: 'Already onboarded' }, { status: 400 })
    }

    // Generate org name from email domain
    const domain = user.email?.split('@')[1]?.split('.')[0] || 'my-org'
    const orgName = domain.charAt(0).toUpperCase() + domain.slice(1)
    const slug = `${domain}-${user.id.slice(0, 8)}`

    // Create organization with trial plan
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: orgName,
        slug,
        org_type,
        plan: 'trial',
        max_users: 5,
        is_active: true,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        is_trial_locked: false,
        settings: {},
      })
      .select('id')
      .single()

    if (orgError || !org) {
      console.error('[onboarding] Org creation failed:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Update user profile with org_id and role
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        org_id: org.id,
        role: ROLE_MAP[org_type],
        full_name: existing?.full_name || user.email?.split('@')[0] || 'User',
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('[onboarding] Profile update failed:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, org_id: org.id })
  } catch (err) {
    console.error('[onboarding] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
