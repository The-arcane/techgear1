
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Product, SupabaseProduct } from '@/lib/types';

// Helper to slugify category names
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(20); // Example: limit to 20 products

    if (error) {
      console.error('Supabase API - Failed to fetch products:', error);
      return NextResponse.json({ message: 'Failed to fetch products from database.', error: error.message }, { status: 500 });
    }

    // Map SupabaseProduct to our application's Product type
    const products: Product[] = data 
      ? data.map((p: SupabaseProduct) => ({
          id: p.id.toString(), // Ensure ID is a string
          name: p.name,
          description: p.description,
          categorySlug: slugify(p.category), // Derive slug from category name
          price: p.price,
          images: [p.image_url], // Use image_url as the primary image
          specifications: {}, // Placeholder for specifications
          stock: p.stock,
        }))
      : [];

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('API - Unexpected error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch products.', error: errorMessage }, { status: 500 });
  }
}

// Placeholder for POST, to be implemented later for adding products via Supabase
// export async function POST(request: Request) {
//   try {
//     const productData = await request.json();
//     // Add validation for productData here using Zod or similar
//     // Map to SupabaseProduct structure before inserting
//     const { data, error } = await supabase.from('products').insert([productData]).select();
//     
//     if (error) {
//       return NextResponse.json({ message: 'Failed to add product.', error: error.message }, { status: 500 });
//     }
//     return NextResponse.json({ message: "Product added", product: data ? data[0] : null }, { status: 201 });
//   } catch (error) {
//     console.error('API - Failed to add product:', error);
//     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//     return NextResponse.json({ message: 'Failed to add product.', error: errorMessage }, { status: 500 });
//   }
// }
