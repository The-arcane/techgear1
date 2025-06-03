
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const requestStartTime = Date.now();
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}. Start time: ${requestStartTime}`);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Middleware] CRITICAL: Supabase URL or Anon Key is missing.");
    return response;
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
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  console.log(`[Middleware] Path: ${request.nextUrl.pathname}. About to call supabase.auth.getUser().`);
  const getUserStartTime = Date.now();
  const { data: { user }, error } = await supabase.auth.getUser();
  const getUserEndTime = Date.now();
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}. supabase.auth.getUser() took ${getUserEndTime - getUserStartTime}ms.`);

  if (error) {
    console.error(`[Middleware] Path: ${request.nextUrl.pathname}. Error from supabase.auth.getUser(): ${error.name} - ${error.message}`, (error as any).status ? `Status: ${(error as any).status}` : '');
  } else if (user) {
    console.log(`[Middleware] Path: ${request.nextUrl.pathname}. User session retrieved/refreshed. User ID: ${user.id}.`);
  } else {
    console.log(`[Middleware] Path: ${request.nextUrl.pathname}. No active user session found.`);
  }
  
  const middlewareEndTime = Date.now();
  console.log(`[Middleware] Path: ${request.nextUrl.pathname}. Total execution time: ${middlewareEndTime - requestStartTime}ms.`);
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
