
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

    // --- FULL SUPABASE AUTHENTICATION AND PROFILE CREATION (TARGET IMPLEMENTATION) ---
    //
    // In a complete Supabase setup, the flow would be:
    //
    // 1. Sign up the user with Supabase Auth:
    //    const { data: authData, error: authError } = await supabase.auth.signUp({
    //      email: email,
    //      password: password,
    //      options: {
    //        data: {
    //          // You can pass metadata to be stored in auth.users table,
    //          // though full_name is often stored in a separate 'profiles' table.
    //        }
    //      }
    //    });
    //
    //    if (authError) {
    //      console.error('Supabase Auth Signup Error:', authError);
    //      return NextResponse.json({ success: false, message: authError.message || "Authentication signup failed." }, { status: 400 });
    //    }
    //    if (!authData.user) {
    //       return NextResponse.json({ success: false, message: "User not created after signup." }, { status: 500 });
    //    }
    //    const userId = authData.user.id; // This is the REAL UUID from Supabase Auth.
    //
    // 2. Create a corresponding public profile in your 'profiles' table:
    //    const { data: profileData, error: profileError } = await supabase
    //      .from('profiles')
    //      .insert([
    //        { 
    //          id: userId, // Use the ID from authData.user.id
    //          full_name: name,
    //          // phone_number: body.phone_number, // if collecting these
    //          // address: body.address,
    //        },
    //      ])
    //      .select();
    //
    //    if (profileError) {
    //      console.error('Supabase Profile Creation Error:', profileError);
    //      // IMPORTANT: If profile creation fails, you might want to consider
    //      // deleting the auth user that was just created to keep data consistent,
    //      // or implement retry logic. This is a critical part of robust error handling.
    //      // For example: await supabase.auth.admin.deleteUser(userId); (requires admin privileges)
    //      return NextResponse.json({ success: false, message: profileError.message || "Profile creation failed after auth user creation." }, { status: 500 });
    //    }
    //
    //    return NextResponse.json({ 
    //      success: true, 
    //      message: "User registered and profile created successfully. Please check your email to confirm.",
    //      user: profileData ? profileData[0] : null 
    //    }, { status: 201 });
    //
    // --- END OF TARGET IMPLEMENTATION ---


    // --- CURRENT TEMPORARY STEP: SIMULATING SIGNUP SUCCESS ---
    // To avoid the foreign key constraint error ("profiles_id_fkey") during this step-by-step development,
    // we are temporarily SKIPPING the actual insertion into the 'profiles' table.
    // The error occurs because 'profiles.id' is a foreign key to 'auth.users.id',
    // and we haven't created an 'auth.users' record first in this simplified API route.
    //
    // const userIdForProfile = crypto.randomUUID(); // This was causing the FK error.
    //
    // const { data: profileData, error: profileError } = await supabase
    //   .from('profiles')
    //   .insert([{ id: userIdForProfile, full_name: name }])
    //   .select();
    //
    // if (profileError) {
    //   console.error('Supabase Profile Creation Error (Simulated):', profileError);
    //   return NextResponse.json({ success: false, message: profileError.message || "Profile creation failed (simulated)." }, { status: 500 });
    // }
    // --- END OF CURRENT TEMPORARY STEP ---

    // For now, we'll return a generic success, as actual user/profile creation is deferred
    // to a more complete Supabase Auth integration.
    return NextResponse.json({ 
      success: true, 
      message: "Signup successful (simulation). Profile creation is currently skipped. Please login.",
      // user: null // No actual user/profile data returned in this simulation
    }, { status: 201 });

  } catch (error) {
    console.error('API Signup Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
