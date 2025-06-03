
import { NextResponse } from 'next/server';
import { z } from 'zod';
// import { supabase } from '@/lib/supabaseClient'; // Supabase client is not used here anymore for direct profile insertion.
// import crypto from 'crypto'; // No longer needed for random UUID generation here.

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export async function POST(request: Request) {
  // This API route is now more of a placeholder.
  // The primary signup logic (creating a user in `auth.users`) should be handled
  // on the client-side by calling `supabase.auth.signUp()`.
  // The `profiles` table entry should ideally be created using Supabase Database Triggers
  // that listen for new users in `auth.users` and use the `options.data` (e.g., full_name)
  // passed during `supabase.auth.signUp()`.

  // This route could be used for auxiliary server-side actions post-signup if needed,
  // but not for the initial user creation or profile insertion if using standard Supabase patterns.

  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Invalid input.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // const { name, email, password } = validation.data;

    // Since client-side handles `supabase.auth.signUp()`, this API route's role changes.
    // If you still need server-side logic after client-side signUp (e.g. sending a welcome email
    // through a different service, or complex profile setup not handled by triggers),
    // this API could be called by the client *after* a successful supabase.auth.signUp().
    // For now, it will just acknowledge.

    return NextResponse.json({
      success: true,
      message: "Signup request acknowledged. Primary user creation is handled client-side with Supabase Auth. Ensure profile creation is handled by triggers or subsequent client logic.",
      // user: null // No user data is created or returned by this specific API endpoint now.
    }, { status: 200 }); // Changed status to 200 as it's just an acknowledgement

  } catch (error) {
    console.error('API Signup (Placeholder) Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
