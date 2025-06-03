
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Running for path: ${request.nextUrl.pathname}`);
  
  // Create the response object once at the beginning.
  // This will be mutated by the cookie handlers if Supabase needs to set/remove cookies.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // The `request` object's cookies are not mutated directly here,
          // Supabase client relies on its internal state being updated by `set`.
          // For the outgoing response, we set the cookie on our single `response` object.
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Similar to `set`, we modify the `response` object's cookies.
          response.cookies.set({ // Or response.cookies.delete(name, options)
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Attempt to refresh the session.
  // This will potentially call the `set` or `remove` handlers above if the session changes.
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('[Middleware] Error getting/refreshing session. Name:', error.name, 'Message:', error.message);
  } else if (session) {
    console.log('[Middleware] Session successfully refreshed/retrieved. User ID:', session.user.id);
  } else {
    console.log('[Middleware] No active session found by getSession().');
  }
  
  // Return the (potentially modified) response object.
  return response;
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
