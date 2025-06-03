
import { NextResponse } from 'next/server';
import { z } from 'zod';
// import { supabase } from '@/lib/supabaseClient'; // Not used directly for password auth in this example

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// --- Mock User Data (Kept for now, will be replaced by Supabase Auth) ---
const mockUsers = [
  { id: 'admin001', email: 'raunaq.adlakha@gmail.com', password: 'Rahu45$', role: 'admin', name: 'Raunaq Adlakha' },
  { id: 'user001', email: 'user@example.com', password: 'password123', role: 'user', name: 'Test User' },
];
// --- End Mock User Data ---

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Invalid input.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = validation.data;

    // --- Supabase Authentication (Conceptual) ---
    // In a real application with Supabase, you would use the Supabase client library
    // on the *client-side* or a server-side auth helper to sign in the user.
    // The API route might be used for custom logic post-login or for server-side sessions.
    //
    // Example client-side login:
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email: 'example@email.com',
    //   password: 'example-password',
    // });
    // if (error) return console.error(error);
    // // User is logged in, session is managed by Supabase client.
    //
    // This API route, for now, will continue to use mock authentication.
    // --- End Supabase Authentication ---


    // --- Mock Authentication (using mockUsers array) ---
    const foundUser = mockUsers.find(u => u.email === email);

    if (foundUser && foundUser.password === password) { // Direct password comparison (unsafe for production)
      const userToReturn = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      };
      // In a real Supabase setup, the token comes from the Supabase session.
      const mockToken = `mockSupabaseToken-${foundUser.id}-${Date.now()}`; 

      return NextResponse.json({ 
        success: true, 
        message: "Login successful (mock).",
        user: userToReturn,
        token: mockToken // This would be the Supabase session token in a real app
      }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: "Invalid email or password (mock)." }, { status: 401 });
    }
    // --- End Mock Authentication ---

  } catch (error) {
    console.error('API Login Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
