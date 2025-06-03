
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Product, SupabaseProduct } from '@/lib/types';

// Helper to slugify category names
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
const DEFAULT_PLACEHOLDER_IMAGE = 'https://placehold.co/600x400.png';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false }); // Example: order by creation date

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
          images: [p.image_url || DEFAULT_PLACEHOLDER_IMAGE], // Use image_url or fallback
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
