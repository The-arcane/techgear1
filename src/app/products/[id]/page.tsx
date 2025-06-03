
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
import { Button } from '@/components/ui/button';

type ProductPageProps = {
  params: { id: string };
};

interface GetProductResult {
  product: Product | null;
  errorType?: 'env_var_missing' | 'fetch_failed' | 'not_found' | 'api_error';
  errorMessage?: string;
  debugFetchUrl?: string;
}

async function getProductById(productId: string): Promise<GetProductResult> {
  const rawEnvVar = process.env.NEXT_PUBLIC_APP_URL;
  console.log(`(getProductById) Initial check - Raw process.env.NEXT_PUBLIC_APP_URL: "${rawEnvVar}" (type: ${typeof rawEnvVar})`);

  let appUrl: string;
  const defaultAppUrl = 'http://localhost:9002'; // Fallback for local development
  let usingFallbackUrl = false;
  let errorType: GetProductResult['errorType'] = undefined;

  if (typeof rawEnvVar === 'string' && rawEnvVar.trim() !== '') {
    // Use the env var, remove trailing slash if present for consistency
    appUrl = rawEnvVar.replace(/\/$/, "");
    console.log(`(getProductById) Successfully read and using NEXT_PUBLIC_APP_URL: ${appUrl}`);
  } else {
    console.warn(
      `CRITICAL (getProductById): NEXT_PUBLIC_APP_URL environment variable is NOT SET, empty, or not a string. 
      Current value: "${rawEnvVar}" (type: ${typeof rawEnvVar}).
      Falling back to default for API calls: ${defaultAppUrl}. 
      This WILL FAIL on deployed environments like Netlify or Vercel. 
      Please ensure NEXT_PUBLIC_APP_URL is correctly set in your hosting provider's environment variables to your site's full public URL (e.g., https://your-site.netlify.app).`
    );
    appUrl = defaultAppUrl;
    usingFallbackUrl = true;
    errorType = 'env_var_missing';
  }

  // Construct the final URL for the API endpoint
  const fetchUrl = `${appUrl}/api/products/${productId}`;

  console.log(`(getProductById) Attempting to fetch product ${productId} from final URL: ${fetchUrl}`);

  try {
    const res = await fetch(fetchUrl, { cache: 'no-store' }); // Fetch fresh data
    if (!res.ok) {
      const responseText = await res.text().catch(() => 'Could not read response text');
      let resolvedErrorType: GetProductResult['errorType'] = errorType || (res.status === 404 ? 'not_found' : 'api_error');
      
      console.error(`(getProductById) Failed to fetch product ${productId} from ${fetchUrl}: ${res.status} ${res.statusText}. Response: ${responseText}`);
      return { product: null, errorType: resolvedErrorType, errorMessage: `API Error ${res.status}: ${res.statusText}. Details: ${responseText}`, debugFetchUrl: fetchUrl };
    }
    const data = await res.json();
    // Log the entire data structure received
    console.log(`(getProductById) Successfully fetched and parsed JSON for product ${productId}. Response data:`, JSON.stringify(data));
    
    if (!data.product && data.message) {
        console.warn(`(getProductById) API returned success but product is null. Message: ${data.message}. URL: ${fetchUrl}`);
        return { product: null, errorType: 'not_found', errorMessage: data.message, debugFetchUrl: fetchUrl };
    }
    if (!data.product && !data.message) {
        console.warn(`(getProductById) API returned success but product is null and no message. URL: ${fetchUrl}`);
        return { product: null, errorType: 'not_found', errorMessage: 'Product data was null in API response.', debugFetchUrl: fetchUrl };
    }
    return { product: data.product, debugFetchUrl: fetchUrl, errorType: usingFallbackUrl ? 'env_var_missing' : undefined };
  } catch (error: any) {
    console.error(`(getProductById) Catch block: Error fetching product ${productId} from ${fetchUrl}:`, error.message, error.stack);
    let resolvedErrorType: GetProductResult['errorType'] = errorType || 'fetch_failed';
     if (error.message.includes('fetch failed')) {
      console.error(`(getProductById) FETCH FAILED. This often means the server could not reach the URL: ${fetchUrl}. If this is a localhost URL on a deployed server, it will fail. Ensure NEXT_PUBLIC_APP_URL is correct.`);
      resolvedErrorType = 'fetch_failed';
    }
    return { product: null, errorType: resolvedErrorType, errorMessage: error.message, debugFetchUrl: fetchUrl };
  }
}


export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const result = await getProductById(params.id);
  const product = result.product;
  if (!product) {
    return {
      title: 'Product Not Found | TechGear',
      description: 'The product you are looking for could not be found.',
    };
  }
  return {
    title: `${product.name} | TechGear`,
    description: product.description.substring(0, 160), 
    openGraph: {
        title: `${product.name} | TechGear`,
        description: product.description.substring(0, 160),
        images: product.images[0] ? [{ url: product.images[0] }] : [],
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = params;
  const result = await getProductById(id);
  const product = result.product;

  if (!product) {
    let title = "Product Not Found";
    let userMessage = `The product you are looking for (ID: ${id}) does not exist or could not be loaded.`;
    let details: string | undefined = `Attempted to fetch from: ${result.debugFetchUrl || 'unknown URL'}.`;

    if (result.errorType === 'env_var_missing') {
      title = "Configuration Error";
      userMessage = `The application's public URL (NEXT_PUBLIC_APP_URL) is not set correctly on the server, so product (ID: ${id}) cannot be loaded.`;
      details = `Please ensure the NEXT_PUBLIC_APP_URL environment variable is set in your deployment settings. Fallback URL used: ${result.debugFetchUrl}. Error: ${result.errorMessage || 'Fetch failed due to missing env var.'}`;
    } else if (result.errorType === 'fetch_failed') {
      title = "Network Error";
      userMessage = `Could not fetch product details (ID: ${id}) from the server API. This might be due to a misconfigured server URL or network issues.`;
      details = `Fetch URL: ${result.debugFetchUrl}. Error: ${result.errorMessage || 'Fetch operation failed.'}`;
    } else if (result.errorType === 'not_found') {
        userMessage = result.errorMessage || `Product with ID ${id} was not found by the API.`;
        details = `Fetch URL: ${result.debugFetchUrl}. Note: API reported 'not found' or product data was null. Error: ${result.errorMessage}`;
    } else if (result.errorType === 'api_error') {
        title = "API Error";
        userMessage = `There was an error retrieving product (ID: ${id}) from the API.`;
        details = `Fetch URL: ${result.debugFetchUrl}. Error: ${result.errorMessage || 'API returned an error.'}`;
    }


    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
          {userMessage}
        </p>
        {details && (
          <p className="text-xs text-muted-foreground/70 bg-muted p-2 rounded-md inline-block mb-6">
            Debug Info: {details}
          </p>
        )}
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
