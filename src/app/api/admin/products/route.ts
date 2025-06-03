
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

const requiredString = (field: string) => z.string().min(1, `${field} is required.`);

const NewProductAPISchema = z.object({
  name: requiredString("Name").min(3, "Name must be at least 3 characters"),
  description: requiredString("Description").min(10, "Description must be at least 10 characters"),
  categorySlug: requiredString("Category"), // This will be stored in 'category' column
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Price must be a positive number"}).transform(val => parseFloat(val)),
  stock: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) >= 0, { message: "Stock must be a non-negative integer"}).transform(val => parseInt(val)),
  imageUrl1: z.string().url("Main Image URL must be a valid URL").or(z.literal("")).optional().default(''),
});

async function isAdmin(supabaseClient: ReturnType<typeof createServerClient<Database>>): Promise<boolean> {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return false;

  const { data: adminData, error } = await supabaseClient
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status in API:", error);
    return false;
  }
  return !!adminData;
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const isUserAdmin = await isAdmin(supabase);
  if (!isUserAdmin) {
    return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = NewProductAPISchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, description, categorySlug, price, stock, imageUrl1 } = validation.data;

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        category: categorySlug, // Storing slug in category column
        price,
        stock,
        image_url: imageUrl1 === '' ? null : imageUrl1, // Explicitly use null for empty string
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating product:', JSON.stringify(error, null, 2));
      let userFriendlyMessage = 'Failed to add product to database. Check server logs for details.';
      let detailedError = error.message;

      // Log the specific error message we are checking against for RLS
      console.log('Checking error message for RLS policy violation. Raw Supabase error message:', error.message);

      if (error.message.toLowerCase().includes('violates row-level security policy') || error.message.toLowerCase().includes('permission denied')) {
        userFriendlyMessage = 'Product creation failed due to a security policy. Please ensure you have admin privileges and that Row Level Security (RLS) policies are correctly set up on the "products" table in Supabase to allow admin inserts. Specifically, check that your user ID is in the "admins" table if RLS relies on it.';
      } else if (error.code === '23505') { // Unique constraint violation
        let fieldInfo = "a unique field (e.g., name)";
        if (error.details) {
            const match = error.details.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists./);
            if (match && match[1]) {
                fieldInfo = `the field '${match[1]}' with value '${match[2]}'`;
            } else {
                fieldInfo = `unique details (detail: ${error.details})`;
            }
        }
        userFriendlyMessage = `Failed to add product: A product with similar ${fieldInfo} already exists.`;
        detailedError = `Database unique constraint (code: 23505) violated: ${error.details || error.message}`;
      } else if (error.code === '23502') { // Not-null violation
        userFriendlyMessage = `Failed to add product: A required field was missing or empty. Detail: ${error.details || error.message}.`;
        detailedError = `Database not-null constraint (code: 23502) violated: ${error.details || error.message}`;
      } else if (error.code === '23503') { // Foreign key violation
        userFriendlyMessage = `Failed to add product: A related record (e.g., a category specified by '${categorySlug}') caused a foreign key violation. Detail: ${error.details || error.message}.`;
        detailedError = `Database foreign key constraint (code: 23503) violated: ${error.details || error.message}`;
      } else if (error.code === '22P02') { // Invalid text representation (e.g. trying to put text into a number field directly in DB)
        userFriendlyMessage = `Failed to add product: Invalid data format for one of the fields. Detail: ${error.details || error.message}.`;
        detailedError = `Database invalid data format (code: 22P02) violated: ${error.details || error.message}`;
      }


      return NextResponse.json({
        success: false,
        message: userFriendlyMessage,
        error: detailedError, // This provides more specific DB error info
        supabase_code: error.code, // Send Supabase code to client for more context if needed
        supabase_details: error.details
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Product added successfully!', product: newProduct }, { status: 201 });

  } catch (e) { // Catch errors from request.json() or other synchronous code before Supabase call
    console.error('API - Unexpected error creating product (e.g., malformed JSON request):', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while processing the request.';
    return NextResponse.json({ success: false, message: 'Failed to process request.', error: errorMessage }, { status: 500 });
  }
}
