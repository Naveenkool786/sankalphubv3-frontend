import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const debug: Record<string, unknown> = {}

  try {
    // Step 1: Check env vars
    debug.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
    debug.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
    debug.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'

    // Step 2: Read cookies
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    debug.cookieCount = allCookies.length
    debug.cookieNames = allCookies.map(c => c.name)
    debug.hasSupabaseCookies = allCookies.some(c => c.name.startsWith('sb-'))

    // Step 3: Create supabase client and check auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    debug.authError = authError?.message ?? null
    debug.userId = user?.id ?? null
    debug.userEmail = user?.email ?? null

    // Step 4: Try profile query with service role
    if (user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      )
      const { data: profile, error: profileError } = await (admin.from('profiles') as any)
        .select('org_id, role, full_name')
        .eq('id', user.id)
        .single()

      debug.profileError = profileError?.message ?? null
      debug.profile = profile ?? null
    }

    // Step 5: Try profile query with regular client
    if (user) {
      const { data: profileRegular, error: profileRegularError } = await supabase
        .from('profiles')
        .select('org_id, role, full_name')
        .eq('id', user.id)
        .single()

      debug.profileRegularError = profileRegularError?.message ?? null
      debug.profileRegular = profileRegular ?? null
    }

  } catch (err: any) {
    debug.unexpectedError = err?.message ?? String(err)
  }

  return NextResponse.json(debug, { status: 200 })
}
