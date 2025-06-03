
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import crypto from 'crypto'; // Import crypto module

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Invalid input.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    // --- IMPORTANT NOTE ON SUPABASE AUTHENTICATION ---
    // The following code attempts to directly insert into the 'profiles' table.
    // This will LIKELY FAIL if the 'id' used for the profile does not already exist
    // in the 'auth.users' table (which is populated by Supabase Authentication).
    //
    // THE CORRECT AND COMPLETE SUPABASE AUTHENTICATION FLOW TYPICALLY INVOLVES:
    // 1. Client-side: Call `supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })`.
    //    This creates the user in `auth.users` and handles email confirmation.
    // 2. Server-side (optional, or via Supabase Triggers): If you need to store additional profile data
    //    not handled by `auth.users` metadata, you would use the `user.id` from the
    //    `auth.signUp` response to insert into your `profiles` table.
    //
    // This API route, as it stands, is a simplified step. If you encounter foreign key
    // constraint errors (like "profiles_id_fkey"), it's because the `id` being inserted
    // into `profiles` doesn't exist in `auth.users`.
    // The long-term solution is to integrate `supabase.auth.signUp()` on the client-side.
    // --- END IMPORTANT NOTE ---

    const userIdForProfile = crypto.randomUUID(); // Generate a valid UUID.

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userIdForProfile, full_name: name }]) // Attempt to insert the profile.
      .select();

    if (profileError) {
      console.error('Supabase Profile Creation Error:', profileError);
      // Check for specific foreign key violation error
      if (profileError.code === '23503') { // PostgreSQL error code for foreign_key_violation
         return NextResponse.json({ 
            success: false, 
            message: `Profile creation failed: User ID ${userIdForProfile} does not exist in authenticated users. Please ensure Supabase Auth signup process is completed first.`,
            details: profileError.message 
        }, { status: 409 }); // Conflict or Bad Request
      }
      return NextResponse.json({ success: false, message: profileError.message || "Profile creation failed." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Signup attempt processed. Profile creation attempted. Please check your Supabase dashboard and console for details. For full functionality, integrate Supabase client-side auth.",
      user: profileData ? profileData[0] : null
    }, { status: 201 });

  } catch (error) {
    console.error('API Signup Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
