
import { NextResponse } from 'next/server';
import { z } from 'zod';

// In a real app, you'd connect to your database here
// import { connectToDatabase } from '@/lib/mongodb';
// import bcrypt from 'bcryptjs'; // For password comparison

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Min 1 for simplicity, real app min 6+
});

// --- Mock User Data (Replace with Database) ---
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

    // --- Mock Database Interaction & Authentication ---
    // In a real application, you would:
    // 1. Connect to your database.
    // const { db } = await connectToDatabase();
    // 2. Find the user by email.
    // const user = await db.collection('users').findOne({ email });
    // 3. If user found, compare the hashed password.
    // if (user && await bcrypt.compare(password, user.password)) { ... }

    const foundUser = mockUsers.find(u => u.email === email);

    if (foundUser && foundUser.password === password) { // Direct password comparison (unsafe for production)
      // Password matches
      const userToReturn = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      };
      const mockToken = `mockToken-${foundUser.id}-${Date.now()}`; // Simulate a JWT

      return NextResponse.json({ 
        success: true, 
        message: "Login successful.",
        user: userToReturn,
        token: mockToken 
      }, { status: 200 });
    } else {
      // User not found or password incorrect
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }
    // --- End Mock Database Interaction ---

  } catch (error) {
    console.error('API Login Error:', error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}
