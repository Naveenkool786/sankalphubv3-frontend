import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // Public routes — always accessible, no auth needed
  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/onboarding' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/demo' ||
    pathname === '/pricing' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')

  // Skip auth check entirely for public routes
  if (isPublic && pathname !== '/login') {
    return supabaseResponse
  }

  // For /login and protected routes, we need to check session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Can't check auth without env vars — pass through
    return supabaseResponse
  }

  let response = supabaseResponse
  let user = null

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase unavailable — treat as unauthenticated
  }

  // Has session + on login page → dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // No session + protected route → login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
