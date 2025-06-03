
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Running for path: ${request.nextUrl.pathname}`);

  // Initialize response at the beginning. This response object will be returned.
  // It can be mutated by Supabase client's cookie handlers.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Middleware] CRITICAL: Supabase URL or Anon Key is missing from environment variables.");
    // Potentially redirect to an error page or just proceed if some paths don't need auth
    return response; // Or handle error appropriately
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // The `set` method is called by Supabase when it needs to update a cookie.
          // We need to update both the `request` (for the current server-side pass)
          // and the `response` (for the browser).
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Update the response object directly.
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // The `remove` method is called by Supabase when it needs to delete a cookie.
          request.cookies.set({ // Effectively removing by setting an empty value with options
            name,
            value: '',
            ...options,
          });
           // Update the response object directly.
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session before passing to the page
  // This will also handle session expiry and refresh tokens.
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('[Middleware] Error from supabase.auth.getUser():', error.name, error.message, 'Status:', (error as any).status);
  } else if (user) {
    console.log('[Middleware] User session retrieved/refreshed in middleware. User ID:', user.id);
  } else {
    console.log('[Middleware] No active user session found by supabase.auth.getUser() in middleware.');
  }
  
  // It's important to return the potentially modified response object.
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
