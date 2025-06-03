
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

const UpdateProfileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters.").max(100).optional().or(z.literal('')),
  phone_number: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
});

export async function PUT(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, message: 'Unauthorized: You must be logged in to update your profile.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = UpdateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { full_name, phone_number, address } = validation.data;

    // Prepare data for Supabase, converting empty strings to null if desired by DB schema for optional fields
    const profileUpdateData: {
      full_name?: string | null;
      phone_number?: string | null;
      address?: string | null;
    } = {};

    if (full_name !== undefined) profileUpdateData.full_name = full_name === '' ? null : full_name;
    if (phone_number !== undefined) profileUpdateData.phone_number = phone_number === '' ? null : phone_number;
    if (address !== undefined) profileUpdateData.address = address === '' ? null : address;
    
    if (Object.keys(profileUpdateData).length === 0) {
      return NextResponse.json({ success: false, message: 'No profile data provided to update.' }, { status: 400 });
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error(`Supabase error updating profile for user ${user.id}:`, updateError);
      if (updateError.message.includes('violates row-level security policy')) {
          return NextResponse.json({ success: false, message: 'Profile update failed due to security policy. Ensure you are updating your own profile and RLS is correctly configured.', error: updateError.message }, { status: 500 });
      }
      return NextResponse.json({ success: false, message: 'Failed to update profile in database.', error: updateError.message }, { status: 500 });
    }

    if (!updatedProfile) {
        return NextResponse.json({ success: false, message: `Profile for user ${user.id} not found or no changes made.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully!', profile: updatedProfile }, { status: 200 });

  } catch (e) {
    console.error(`API - Unexpected error updating profile for user ${user.id}:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to process request.', error: errorMessage }, { status: 500 });
  }
}
