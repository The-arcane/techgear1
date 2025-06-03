
import Image from 'next/image';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button'; // Added Button import

type ProductPageProps = {
  params: { id: string };
};

async function getProductById(productId: string): Promise<Product | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error(
      `Configuration Error: NEXT_PUBLIC_APP_URL environment variable is not set. 
      This is required for server-side API calls to function correctly (e.g., for product detail pages).
      Please create or update your .env.local file in the root of your project and add:
      NEXT_PUBLIC_APP_URL=http://localhost:9002 
      (Replace 9002 with your actual development port if different).
      Then, restart your development server.
      This is crucial for server-side API calls.`
    );
  }

  const fetchUrl = `${appUrl}/api/products/${productId}`;

  try {
    const res = await fetch(fetchUrl, { cache: 'no-store' }); // Fetch fresh data
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`Failed to fetch product ${productId} from ${fetchUrl}: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data.product;
  } catch (error) {
    console.error(`Error fetching product ${productId} from ${fetchUrl}:`, error);
    return null;
  }
}


export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) {
    return {
      title: 'Product Not Found | TechGear',
      description: 'The product you are looking for could not be found.',
    };
  }
  return {
    title: `${product.name} | TechGear`,
    description: product.description.substring(0, 160), // Keep description concise for metadata
    openGraph: {
        title: `${product.name} | TechGear`,
        description: product.description.substring(0, 160),
        images: product.images[0] ? [{ url: product.images[0] }] : [],
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = params;
  const product = await getProductById(id);

  if (!product) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The product you are looking for (ID: {id}) does not exist or may have been removed.
        </p>
        <Link href="/" className="mt-6 inline-block">
           <Button variant="outline">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <nav className="flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
          </li>
          <li><ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" /></li>
          <li>
            <Link href={`/category/${product.categorySlug}`} className="text-muted-foreground hover:text-foreground">
              {product.categorySlug.charAt(0).toUpperCase() + product.categorySlug.slice(1).replace('-', ' ')}
            </Link>
          </li>
          <li><ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" /></li>
          <li>
            <span className="font-medium text-foreground">{product.name}</span>
          </li>
        </ol>
      </nav>

      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0 md:gap-px"> {/* Use gap-px for border effect */}
          {/* Image Gallery Section */}
          <div className="bg-card md:border-r"> {/* Simulates border if needed */}
            <div className="p-4 md:p-8">
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={product.images[0] || 'https://placehold.co/600x400.png'}
                  alt={product.name}
                  layout="fill"
                  objectFit="contain" // Use contain to show full image
                  priority
                  data-ai-hint={`${product.categorySlug} ${product.name.split(' ')[0]}`}
                />
              </div>
              {/* Placeholder for multiple images/carousel */}
              {product.images.length > 1 && (
                <div className="mt-4 flex space-x-2 justify-center">
                  {product.images.map((img, index) => (
                    <div key={index} className="relative w-16 h-16 rounded border overflow-hidden cursor-pointer hover:border-primary">
                      <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} layout="fill" objectFit="cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details Section */}
          <div className="bg-card">
             <CardHeader className="p-4 md:p-8">
              <CardTitle className="text-3xl md:text-4xl font-bold font-headline">{product.name}</CardTitle>
              <div className="mt-2">
                <Link href={`/category/${product.categorySlug}`}>
                  <Badge variant="secondary" className="hover:bg-accent hover:text-accent-foreground transition-colors">
                    {product.categorySlug.charAt(0).toUpperCase() + product.categorySlug.slice(1).replace('-', ' ')}
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-8 pt-0">
              <CardDescription className="text-base text-muted-foreground mb-6">
                {product.description}
              </CardDescription>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">₹{product.price.toFixed(2)}</span>
              </div>

              <div className="mb-6">
                {product.stock > 0 ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>In Stock ({product.stock} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>
              
              <AddToCartButton product={product} className="w-full text-lg py-3" size="lg"/>

              <Separator className="my-8" />

              <div>
                <h3 className="text-xl font-semibold mb-4 font-headline">Specifications</h3>
                {Object.keys(product.specifications).length > 0 ? (
                  <Table>
                    <TableBody>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium w-1/3">{key}</TableCell>
                          <TableCell>{value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No specifications available for this product.</p>
                )}
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
