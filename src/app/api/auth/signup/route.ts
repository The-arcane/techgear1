
import { NextResponse } from 'next/server';
import { z } from 'zod';

// In a real app, you'd connect to your database here
// import { connectToDatabase } from '@/lib/mongodb';

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

    // --- Mock Database Interaction ---
    // In a real application, you would:
    // 1. Connect to your database.
    // const { db } = await connectToDatabase();
    // 2. Check if the user already exists.
    // const existingUser = await db.collection('users').findOne({ email });
    // if (existingUser) {
    //   return NextResponse.json({ success: false, message: "User already exists with this email." }, { status: 409 });
    // }
    // 3. Hash the password.
    // const hashedPassword = await bcrypt.hash(password, 10);
    // 4. Save the new user to the database.
    // await db.collection('users').insertOne({ name, email, password: hashedPassword, role: 'user', createdAt: new Date() });
    
    console.log(`Mock signup for: ${name}, ${email}`);
    // Simulate successful user creation
    // --- End Mock Database Interaction ---

    return NextResponse.json({ success: true, message: "User registered successfully (mock). Please login." }, { status: 201 });

  } catch (error) {
    console.error('API Signup Error:', error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}
