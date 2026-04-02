'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginWithPassword(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  // Do NOT call redirect() here — it throws before cookies are committed.
  // Return success and let the client do a full-page navigation.
  return { error: null }
}
