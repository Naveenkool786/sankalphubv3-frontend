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
      return NextResponse.json({ projects: [] })
    }

    const admin = createAdminClient()
    const { data: profile } = await (admin.from('profiles') as any)
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ projects: [] })
    }

    const { data: projects } = await (admin.from('projects') as any)
      .select('id, name, factory_id, product_category, po_number, quantity, aql_level, factories(name)')
      .eq('org_id', profile.org_id)
      .order('name')

    return NextResponse.json({ projects: projects || [] })
  } catch (err: any) {
    console.error('Projects list error:', err)
    return NextResponse.json({ error: err.message, projects: [] }, { status: 500 })
  }
}
