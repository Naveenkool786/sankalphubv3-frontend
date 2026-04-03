import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ factories: [] })
    }

    const admin = createAdminClient()
    const { data: profile } = await (admin.from('profiles') as any)
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ factories: [] })
    }

    const { data: factories } = await (admin.from('factories') as any)
      .select('id, name, city, country, status')
      .eq('org_id', profile.org_id)
      .eq('status', 'active')
      .order('name')

    return NextResponse.json({ factories: factories || [] })
  } catch (err: any) {
    console.error('Factories list error:', err)
    return NextResponse.json({ error: err.message, factories: [] }, { status: 500 })
  }
}
