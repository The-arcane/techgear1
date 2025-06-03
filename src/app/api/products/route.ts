import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { Product } from '@/lib/types'; // Ensure Product type is correctly defined

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    // Ensure you have a 'products' collection in your MONGODB_DB
    const productsCollection = db.collection<Product>('products');
    
    const products = await productsCollection
      .find({})
      .limit(20) // Example: limit to 20 products for initial testing
      .toArray();

    // If using string IDs in your Product type, you might need to map _id from MongoDB
    // For example: products.map(p => ({ ...p, id: p._id.toString() }))
    // However, if Product type expects _id as ObjectId or string, adjust accordingly.

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('API - Failed to fetch products:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch products from database.', error: errorMessage }, { status: 500 });
  }
}

// Placeholder for POST, to be implemented later for adding products
// export async function POST(request: Request) {
//   try {
//     const { db } = await connectToDatabase();
//     const productData = await request.json();
//     // Add validation for productData here using Zod or similar
//     const result = await db.collection('products').insertOne(productData);
//     return NextResponse.json({ message: "Product added", productId: result.insertedId }, { status: 201 });
//   } catch (error) {
//     console.error('API - Failed to add product:', error);
//     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//     return NextResponse.json({ message: 'Failed to add product.', error: errorMessage }, { status: 500 });
//   }
// }
