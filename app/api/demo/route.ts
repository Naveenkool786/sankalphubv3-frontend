/**
 * POST /api/demo — Demo request submission
 *
 * Inserts into Supabase `demo_requests` table.
 *
 * Run this migration in Supabase SQL editor before first use:
 *
 *   create table if not exists demo_requests (
 *     id               uuid        default gen_random_uuid() primary key,
 *     role             text        not null,
 *     full_name        text        not null,
 *     company_name     text        not null,
 *     email            text        not null,
 *     phone            text,
 *     product_categories text[],
 *     metadata         jsonb,
 *     created_at       timestamptz default now()
 *   );
 *
 *   -- Allow unauthenticated inserts (public lead capture):
 *   alter table demo_requests enable row level security;
 *   create policy "allow_anon_insert" on demo_requests
 *     for insert to anon with check (true);
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createNotification } from '@/lib/notifications'

const schema = z.object({
  role: z.enum(['factory', 'brand', 'agency']),
  full_name: z.string().min(2, 'Name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().nullable().optional(),
  metadata: z.object({
    country: z.string().nullable().optional(),
    product_focus: z.string().nullable().optional(),
    team_size: z.string().nullable().optional(),
    client_count: z.string().nullable().optional(),
    categories: z.array(z.string()).nullable().optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }

    const { role, full_name, company_name, email, phone, metadata } = parsed.data

    // Use service role key to bypass RLS (server-side only — safe)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      // Fallback: log to console and return success so the form still works
      // while env vars are being configured on Vercel
      console.warn('[demo/route] Missing SUPABASE_SERVICE_ROLE_KEY — request logged only:', {
        role, full_name, company_name, email,
      })
      return NextResponse.json({ success: true })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { error } = await supabase.from('demo_requests').insert({
      role,
      full_name,
      company_name,
      email,
      phone: phone ?? null,
      product_categories: metadata?.categories ?? null,
      metadata: {
        country: metadata?.country ?? null,
        product_focus: metadata?.product_focus ?? null,
        team_size: metadata?.team_size ?? null,
        client_count: metadata?.client_count ?? null,
      },
    })

    if (error) {
      console.error('[demo/route] Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save request. Please try again.' }, { status: 500 })
    }

    // Notify founder about new demo request (non-blocking)
    createNotification({
      organizationId: process.env.FOUNDER_ORG_ID ?? '',
      eventType: 'new_demo_request',
      soundCategory: 'system',
      title: 'New demo request',
      detail: `${full_name} · ${company_name} · ${email}`,
      link: '/console/demo-requests',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[demo/route] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
