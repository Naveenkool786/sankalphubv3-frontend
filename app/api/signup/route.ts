import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { createNotification } from '@/lib/notifications'

const ROLE_MAP: Record<string, string> = {
  factory: 'factory_manager',
  brand: 'brand_manager',
  agency: 'inspector',
}

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  orgType: z.enum(['factory', 'brand', 'agency']),
  jobTitle: z.string().optional(),
  invites: z.array(z.object({
    email: z.string().email(),
    role: z.enum(['brand_manager', 'factory_manager', 'inspector', 'viewer']),
  })).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { email, password, companyName, country, city, orgType, jobTitle, invites } = parsed.data

    // 1. Create auth user via server client (sets session cookies)
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Sign in instead.' },
          { status: 409 },
        )
      }
      console.error('[signup] Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    if (!authData.session) {
      return NextResponse.json(
        { error: 'Email confirmation is required. Please check your inbox and verify your email.' },
        { status: 202 },
      )
    }

    const userId = authData.user.id

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    const admin = createServiceClient(supabaseUrl, serviceKey)

    // 2. Create organization
    const domain = email.split('@')[1]?.split('.')[0] || 'my-org'
    const slug = `${domain}-${userId.slice(0, 8)}`

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: companyName,
        slug,
        org_type: orgType,
        plan: 'trial',
        max_users: 5,
        is_active: true,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        is_trial_locked: false,
        settings: { country, city },
      })
      .select('id')
      .single()

    if (orgError || !org) {
      console.error('[signup] Org creation failed:', orgError)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // 3. Update profile (Supabase trigger auto-creates profile row on signUp)
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        org_id: org.id,
        role: ROLE_MAP[orgType],
        full_name: companyName,
        department: jobTitle || null,
      })
      .eq('id', userId)

    if (profileError) {
      console.error('[signup] Profile update failed:', profileError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // 4. Send invites (non-blocking — failures don't fail the signup)
    const inviteErrors: string[] = []
    const validInvites = invites?.filter(i => i.email.trim()) ?? []

    if (validInvites.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

      for (const invite of validInvites) {
        try {
          const { data: userData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
            invite.email,
            { redirectTo: `${appUrl}/auth/callback?type=invite` },
          )
          if (inviteError) {
            inviteErrors.push(`${invite.email}: ${inviteError.message}`)
            continue
          }
          await admin
            .from('profiles')
            .update({
              org_id: org.id,
              role: invite.role,
              invite_token: randomUUID(),
              invited_by: userId,
            })
            .eq('id', userData.user.id)
        } catch (err) {
          inviteErrors.push(`${invite.email}: unexpected error`)
        }
      }
    }

    if (inviteErrors.length > 0) {
      console.warn('[signup] Some invites failed:', inviteErrors)
    }

    // Notify founder about new signup (non-blocking)
    createNotification({
      organizationId: process.env.FOUNDER_ORG_ID ?? '',
      eventType: 'new_user_signup',
      soundCategory: 'system',
      title: 'New user signup',
      detail: `${companyName} · ${orgType} · trial plan`,
      link: '/console/users',
    })

    return NextResponse.json({
      success: true,
      org_id: org.id,
      inviteErrors: inviteErrors.length > 0 ? inviteErrors : undefined,
    })
  } catch (err) {
    console.error('[signup] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
