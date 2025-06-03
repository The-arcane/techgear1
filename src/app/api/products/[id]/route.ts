
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Product, SupabaseProduct } from '@/lib/types';

// Helper to slugify category names (consistent with the all products route)
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
const DEFAULT_PLACEHOLDER_IMAGE = 'https://placehold.co/600x400.png';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ message: 'Product ID is required.' }, { status: 400 });
  }

  try {
    // Supabase product ID is an integer, so parse the param
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ message: 'Invalid Product ID format.' }, { status: 400 });
    }

    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error code for "Resource not found"
        return NextResponse.json({ message: `Product with ID ${id} not found.` }, { status: 404 });
      }
      console.error('Supabase API - Failed to fetch product by ID:', error);
      return NextResponse.json({ message: 'Failed to fetch product from database.', error: error.message }, { status: 500 });
    }

    if (!productData) {
      return NextResponse.json({ message: `Product with ID ${id} not found.` }, { status: 404 });
    }

    const typedProductData = productData as SupabaseProduct;

    const product: Product = {
      id: typedProductData.id.toString(),
      name: typedProductData.name,
      description: typedProductData.description,
      categorySlug: slugify(typedProductData.category),
      price: typedProductData.price,
      images: [typedProductData.image_url || DEFAULT_PLACEHOLDER_IMAGE], // Use image_url or fallback
      specifications: {}, // Placeholder
      stock: typedProductData.stock,
    };

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('API - Unexpected error fetching product by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch product.', error: errorMessage }, { status: 500 });
  }
}
