
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

const UpdateProductAPISchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  categorySlug: z.string().min(1, "Category is required").optional(),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Price must be a positive number"}).transform(val => parseFloat(val)).optional(),
  stock: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) >= 0, { message: "Stock must be a non-negative integer"}).transform(val => parseInt(val)).optional(),
  imageUrl1: z.string().url("Main Image URL must be a valid URL").or(z.literal("")).optional(),
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

  const { id } = params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ success: false, message: 'Invalid Product ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = UpdateProductAPISchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, description, categorySlug, price, stock, imageUrl1 } = validation.data;

    const updateData: Partial<{
      name: string;
      description: string;
      category: string;
      price: number;
      stock: number;
      image_url: string | null;
    }> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (categorySlug !== undefined) updateData.category = categorySlug;
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (imageUrl1 !== undefined) updateData.image_url = imageUrl1 || null;


    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ success: false, message: 'No fields to update provided.' }, { status: 400 });
    }
    
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error updating product ${productId}:`, error);
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ success: false, message: `Product with ID ${productId} not found.` }, { status: 404 });
      }
      if (error.message.includes('violates row-level security policy')) {
          return NextResponse.json({ success: false, message: 'Failed to update product. Please ensure you have admin privileges and RLS policies are correctly set up on the "products" table for updates.', error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: false, message: 'Failed to update product in database.', error: error.message }, { status: 500 });
    }

    if (!updatedProduct) { // Should be caught by PGRST116, but as a safeguard
        return NextResponse.json({ success: false, message: `Product with ID ${productId} not found or no changes made.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product updated successfully!', product: updatedProduct }, { status: 200 });

  } catch (error) {
    console.error(`API - Unexpected error updating product ${productId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to process request.', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

  const { id } = params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ success: false, message: 'Invalid Product ID.' }, { status: 400 });
  }

  try {
    // Check if product is referenced in order_items
    const { data: orderItems, error: orderItemError } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', productId)
        .limit(1);

    if (orderItemError) {
        console.error(`Error checking order_items for product ${productId}:`, orderItemError);
        return NextResponse.json({ success: false, message: 'Error checking product references.', error: orderItemError.message }, { status: 500 });
    }

    if (orderItems && orderItems.length > 0) {
        return NextResponse.json({ 
            success: false, 
            message: `Cannot delete product. It is referenced in ${orderItems.length} order(s). Consider disabling or archiving the product instead.`,
            details: `Referenced in order ID(s): ${orderItems.map(oi => oi.order_id).join(', ')}`
        }, { status: 409 }); // 409 Conflict
    }


    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error(`Supabase error deleting product ${productId}:`, deleteError);
      if (deleteError.code === 'PGRST116') { // Not found, though count check should prevent this.
        return NextResponse.json({ success: false, message: `Product with ID ${productId} not found.` }, { status: 404 });
      }
       if (deleteError.message.includes('violates row-level security policy')) {
          return NextResponse.json({ success: false, message: 'Failed to delete product. Please ensure you have admin privileges and RLS policies are correctly set up for deletes.', error: deleteError.message }, { status: 500 });
      }
      // Handle foreign key constraint violation (e.g., product is in an order)
      if (deleteError.message.includes('violates foreign key constraint')) {
          return NextResponse.json({ success: false, message: 'Cannot delete product as it is referenced in existing orders. Consider archiving the product instead.', error: deleteError.message }, { status: 409 }); // 409 Conflict
      }
      return NextResponse.json({ success: false, message: 'Failed to delete product from database.', error: deleteError.message }, { status: 500 });
    }
    
    // Note: .delete() with .single() or checking affected rows is tricky with Supabase.
    // We assume if no error, it was successful or product didn't exist.
    // A prior check for existence could be added if strict "not found" for delete is needed.

    return NextResponse.json({ success: true, message: 'Product deleted successfully!' }, { status: 200 });

  } catch (error) {
    console.error(`API - Unexpected error deleting product ${productId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to process request.', error: errorMessage }, { status: 500 });
  }
}
