
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Product, SupabaseProduct } from '@/lib/types';

// Helper to slugify category names (consistent with the all products route)
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
const DEFAULT_PLACEHOLDER_IMAGE = 'https://placehold.co/600x400.png';
const DEFAULT_CATEGORY_SLUG = 'uncategorized';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[/api/products/[id]] Received request for product ID: ${id}`);

  if (!id) {
    console.log('[/api/products/[id]] Product ID is missing from params.');
    return NextResponse.json({ message: 'Product ID is required.' }, { status: 400 });
  }

  try {
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      console.log(`[/api/products/[id]] Invalid Product ID format: ${id}. Parsed to NaN.`);
      return NextResponse.json({ message: 'Invalid Product ID format.' }, { status: 400 });
    }

    console.log(`[/api/products/[id]] Attempting to fetch product with parsed ID: ${productId} from Supabase.`);
    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error(`[/api/products/[id]] Supabase error fetching product ID ${productId}:`, JSON.stringify(error, null, 2));
      if (error.code === 'PGRST116') { // PostgREST error code for "Resource not found"
        console.log(`[/api/products/[id]] Product with ID ${productId} not found in Supabase (PGRST116).`);
        return NextResponse.json({ message: `Product with ID ${id} not found.` }, { status: 404 });
      }
      // Log other Supabase errors but return a generic 500 for them.
      return NextResponse.json({ message: 'Failed to fetch product from database.', error: error.message }, { status: 500 });
    }

    if (!productData) {
      // This case should ideally be covered by PGRST116, but as a fallback.
      console.log(`[/api/products/[id]] Product data is null for ID ${productId} after Supabase query (no error, but no data).`);
      return NextResponse.json({ message: `Product with ID ${id} not found.` }, { status: 404 });
    }

    console.log(`[/api/products/[id]] Successfully fetched product data for ID ${productId}:`, JSON.stringify(productData, null, 2));
    const typedProductData = productData as SupabaseProduct;

    let categorySlugValue = DEFAULT_CATEGORY_SLUG;
    if (typedProductData.category && typeof typedProductData.category === 'string' && typedProductData.category.trim() !== '') {
      try {
        categorySlugValue = slugify(typedProductData.category);
      } catch (e) {
        console.error(`[/api/products/[id]] Error slugifying category '${typedProductData.category}' for product ID ${productId}:`, e);
        // Keep default slug if slugify fails
      }
    } else {
      console.warn(`[/api/products/[id]] Product ID ${productId} has a null, empty, or non-string category. Defaulting slug to '${DEFAULT_CATEGORY_SLUG}'. Category was:`, typedProductData.category);
    }

    const product: Product = {
      id: typedProductData.id.toString(),
      name: typedProductData.name,
      description: typedProductData.description || '', // Ensure description is not null
      categorySlug: categorySlugValue,
      price: typedProductData.price,
      images: [typedProductData.image_url || DEFAULT_PLACEHOLDER_IMAGE],
      specifications: {}, // Placeholder, ensure this field exists on SupabaseProduct or handle if it doesn't
      stock: typedProductData.stock || 0, // Ensure stock is not null
    };

    console.log(`[/api/products/[id]] Returning transformed product data for ID ${productId}.`);
    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    // This catch block is for unexpected errors in the try block itself (e.g., JSON parsing, etc.)
    console.error(`[/api/products/[id]] Unexpected error in API route for product ID ${id}:`, error instanceof Error ? error.message : JSON.stringify(error));
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to process product request.', error: errorMessage }, { status: 500 });
  }
}
