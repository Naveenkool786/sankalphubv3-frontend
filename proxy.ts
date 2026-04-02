import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — this ensures cookies stay valid
  await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — always accessible, no auth check
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/onboarding') ||
    pathname === '/api/demo' ||
    pathname === '/api/signup' ||
    pathname === '/privacy' ||
    pathname === '/terms'

  if (isPublic) {
    return supabaseResponse
  }

  // For protected routes, check if auth cookies exist
  // The actual auth verification happens in the layout via auth.getUser()
  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))
  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
