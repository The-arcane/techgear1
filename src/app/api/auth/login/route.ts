
import { NextResponse } from 'next/server';
import { z } from 'zod';
// import { supabase } from '@/lib/supabaseClient'; // Not used for direct password auth here

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export async function POST(request: Request) {
  // This API route is now a placeholder for user login.
  // The primary login logic (verifying credentials and creating a session)
  // should be handled on the client-side by calling `supabase.auth.signInWithPassword()`.
  // Supabase client library handles session management (JWTs, localStorage).

  // This route could be used for:
  // 1. Custom server-side logic *after* a successful client-side Supabase login
  //    (e.g., logging login activity, custom session setup if not using Supabase's default).
  // 2. OAuth flows that require a server-side callback handler.
  // It is NOT intended for direct password verification if using Supabase client-side auth.

  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Invalid input.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // const { email, password } = validation.data;

    // Since client-side handles `supabase.auth.signInWithPassword()`, this API route's role changes.
    // It no longer performs direct password verification.
    return NextResponse.json({ 
      success: true, 
      message: "Login request acknowledged. Primary authentication is handled client-side with Supabase Auth.",
      // user: null, // No user data or token is returned by this specific API endpoint now.
      // token: null 
    }, { status: 200 });

  } catch (error) {
    console.error('API Login (Placeholder) Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
