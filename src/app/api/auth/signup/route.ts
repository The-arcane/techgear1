
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import crypto from 'crypto'; // Import crypto module

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  // Add other fields for profiles table if needed, e.g., phone_number, address
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Invalid input.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    // --- Supabase Auth User Creation (Conceptual - Full Integration Recommended) ---
    // In a full Supabase setup, you'd first sign up the user with Supabase Auth:
    // const { data: authData, error: authError } = await supabase.auth.signUp({
    //   email: email,
    //   password: password,
    //   options: {
    //     data: {
    //       full_name: name, 
    //       // other metadata for auth.users table if needed
    //     }
    //   }
    // });

    // if (authError) {
    //   console.error('Supabase Auth Signup Error:', authError);
    //   return NextResponse.json({ success: false, message: authError.message || "Authentication signup failed." }, { status: 400 });
    // }
    // if (!authData.user) {
    //    return NextResponse.json({ success: false, message: "User not created after signup." }, { status: 500 });
    // }
    // const userId = authData.user.id; // This would be the REAL UUID from Supabase Auth
    // --- End Supabase Auth User Creation ---
    
    // --- Simplified Profile Creation ---
    // For this example, we'll simulate inserting into the 'profiles' table.
    // In a real scenario, the 'id' for the profiles table should be the Supabase auth user's ID.
    // We are generating a valid UUID here to satisfy the column type.
    // Ideally, this ID comes from the actual Supabase Auth user creation process shown above.
    
    const userIdForProfile = crypto.randomUUID(); // Generate a valid UUID

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: userIdForProfile, // Use the generated valid UUID
          full_name: name,
          // email: email, // profiles table doesn't have email based on your schema, email is in auth.users
          // phone_number: body.phone_number, // if you add these to form and schema
          // address: body.address,
        },
      ])
      .select();

    if (profileError) {
      console.error('Supabase Profile Creation Error:', profileError);
      // You might want to handle the case where auth user was created but profile failed (e.g., delete auth user or retry)
      return NextResponse.json({ success: false, message: profileError.message || "Profile creation failed." }, { status: 500 });
    }
    // --- End Simplified Profile Creation ---


    // For now, we'll return a generic success, as JWT/session management would be handled by Supabase client libraries
    return NextResponse.json({ 
      success: true, 
      message: "User registered successfully (mock profile created with valid UUID). Please login.",
      // user: profileData ? profileData[0] : null // You might return the created profile
    }, { status: 201 });

  } catch (error) {
    console.error('API Signup Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
