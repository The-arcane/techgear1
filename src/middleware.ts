
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid running supabase.auth.getUser() here if not strictly necessary for all paths,
  // as it can interfere with the auth flow for certain API routes or redirects.
  // Session refresh is handled by a getSession() call if you need to check auth status.
  // For simple session presence and refresh, accessing supabase.auth (e.g. by trying to get session) is enough.

  // Example: Refresh session for all requests. This is usually handled by Supabase client automatically.
  // Forcing a getSession() can ensure cookies are refreshed if needed.
  await supabase.auth.getSession()


  // Optional: Protect routes in middleware
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user && request.nextUrl.pathname.startsWith('/orders')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  // if (!user && request.nextUrl.pathname.startsWith('/profile')) {
  //    return NextResponse.redirect(new URL('/login', request.url));
  // }


  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
