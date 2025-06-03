
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Uses the anon key by default
import type { Product, SupabaseProduct } from '@/lib/types';

// Helper to slugify category names (consistent with the all products route)
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');
const DEFAULT_PLACEHOLDER_IMAGE = 'https://placehold.co/600x400.png';
const DEFAULT_CATEGORY_SLUG = 'uncategorized';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const requestStartTime = Date.now();
  console.log(`[/api/products/[id]] Path: ${request.url}. Received request for product ID: ${id}. Start time: ${requestStartTime}`);

  if (!id) {
    console.log('[/api/products/[id]] Product ID is missing from params.');
    return NextResponse.json({ message: 'Product ID is required.' }, { status: 400 });
  }

  let productId: number;
  try {
    productId = parseInt(id, 10);
    if (isNaN(productId)) {
      console.log(`[/api/products/[id]] Invalid Product ID format: ${id}. Parsed to NaN.`);
      return NextResponse.json({ message: 'Invalid Product ID format.' }, { status: 400 });
    }
  } catch (parseError) {
    console.error(`[/api/products/[id]] Error parsing product ID '${id}':`, parseError);
    return NextResponse.json({ message: 'Error parsing Product ID.' }, { status: 400 });
  }

  console.log(`[/api/products/[id]] Attempting to fetch product with parsed ID: ${productId} from Supabase.`);
  const queryStartTime = Date.now();
  const { data: productData, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  const queryEndTime = Date.now();
  console.log(`[/api/products/[id]] Supabase query for ID ${productId} took ${queryEndTime - queryStartTime}ms.`);

  if (error) {
    console.error(`[/api/products/[id]] Supabase error fetching product ID ${productId}. Code: ${error.code}, Message: ${error.message}, Details: ${error.details}, Hint: ${error.hint}. Full Error:`, JSON.stringify(error, null, 2));
    if (error.code === 'PGRST116') { // PostgREST error code for "Resource not found"
      console.log(`[/api/products/[id]] Product with ID ${productId} explicitly not found in Supabase (PGRST116).`);
      return NextResponse.json({ message: `Product with ID ${id} not found.` }, { status: 404 });
    }
    // Log other Supabase errors but return a generic 500 for them.
    return NextResponse.json({ message: 'Failed to fetch product from database due to Supabase error.', errorDetails: error.message }, { status: 500 });
  }

  if (!productData) {
    // This is a crucial log for RLS issues. If there's no error, but no data, RLS is the prime suspect.
    console.log(`[/api/products/[id]] Product data is NULL for ID ${productId} after Supabase query (no explicit error from Supabase, but no data returned). This strongly indicates RLS is blocking access or the product truly does not exist. Check RLS policies and table-level grants for 'anon' and 'authenticated' roles on 'products' table.`);
    return NextResponse.json({ message: `Product with ID ${id} not found or access denied.` }, { status: 404 });
  }

  console.log(`[/api/products/[id]] Successfully fetched raw product data for ID ${productId}:`, JSON.stringify(productData, null, 2));
  const typedProductData = productData as SupabaseProduct;

  let categorySlugValue = DEFAULT_CATEGORY_SLUG;
  if (typedProductData.category && typeof typedProductData.category === 'string' && typedProductData.category.trim() !== '') {
    try {
      categorySlugValue = slugify(typedProductData.category);
    } catch (e: any) { 
      console.error(`[/api/products/[id]] Error slugifying category '${typedProductData.category}' for product ID ${productId}:`, e.message, e.stack);
    }
  } else {
    console.warn(`[/api/products/[id]] Product ID ${productId} has a null, empty, or non-string category. Defaulting slug to '${DEFAULT_CATEGORY_SLUG}'. Category was:`, typedProductData.category);
  }

  const product: Product = {
    id: typedProductData.id.toString(),
    name: typedProductData.name,
    description: typedProductData.description || '',
    categorySlug: categorySlugValue,
    price: typedProductData.price,
    images: [typedProductData.image_url || DEFAULT_PLACEHOLDER_IMAGE],
    specifications: {}, 
    stock: typedProductData.stock === null || typedProductData.stock === undefined ? 0 : typedProductData.stock,
  };

  console.log(`[/api/products/[id]] Returning transformed product data for ID ${productId}. Total time: ${Date.now() - requestStartTime}ms.`);
  return NextResponse.json({ product }, { status: 200 });
}
