import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface ConsoleContext {
  userId: string
  fullName: string
  email: string
}

export async function getConsoleContext(): Promise<ConsoleContext> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string; full_name: string } | null
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')

  return {
    userId: user.id,
    fullName: profile.full_name || user.email?.split('@')[0] || 'Admin',
    email: user.email ?? '',
  }
}
