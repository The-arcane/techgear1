
"use client"; 

import { useState, useEffect, use } from 'react'; // Added use
import { ProductCard } from '@/components/products/ProductCard';
import { getCategoryBySlug, categories as mockCategories } from '@/lib/data'; 
import type { Product, Category } from '@/lib/types';
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Added Button import

// Type for params if it's a promise, as suggested by the warning
type CategoryPageParams = { slug: string };
type CategoryPageProps = {
  params: Promise<CategoryPageParams>; // params is treated as a Promise
};

export default function CategoryPage({ params: paramsPromise }: CategoryPageProps) {
  // Unwrap the params promise using React.use()
  // This will suspend if the promise is not yet resolved.
  const params = use(paramsPromise);
  const { slug } = params; 

  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Keep true for initial data fetch
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This useEffect will run once `slug` is available (after paramsPromise resolves)
    // and then if `slug` changes.
    if (!slug) {
      // This case should ideally not be hit if `use(paramsPromise)` suspends until resolved.
      // But as a safeguard:
      setError("Category slug is not available.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true); // Set loading true when slug is available and we start fetching

    const fetchCategoryDetails = () => {
      const cat = getCategoryBySlug(slug);
      if (cat) {
        setCategory(cat);
        document.title = `${cat.name} | TechGear`;
      } else {
        setError("Category not found.");
      }
    };

    const fetchProducts = async () => {
      setError(null);
      try {
        const res = await fetch(`/api/products`); 
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.statusText}`);
        }
        const data = await res.json();
        const allProducts: Product[] = data.products || [];
        
        const categoryProducts = allProducts.filter(p => p.categorySlug === slug);
        setProducts(categoryProducts);

      } catch (err) {
        console.error("Error fetching products for slug:", slug, err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching products.");
        setProducts([]);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchCategoryDetails();
    fetchProducts();

  }, [slug]); // Depend on slug

  // Initial loading state (might be shown briefly if `use(paramsPromise)` resolves quickly
  // or if there's further loading for category details/products)
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading {slug ? `products for ${slug}` : 'category'}...</p>
      </div>
    );
  }
  
  if (error && !category) { 
     return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive mb-4">Category Not Found</h1>
        <p className="text-muted-foreground">
          The category you are looking for ({slug || 'unknown'}) does not exist.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button> 
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }
  
  if (!category && slug) { 
    return <div className="text-center py-10">Category details for "{slug}" could not be loaded.</div>
  }


  return (
    <div className="space-y-8">
      <nav className="flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-2 text-sm">
          <li>
            <div className="flex items-center">
              <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="ml-2 font-medium text-foreground">{category?.name || slug}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="pb-6 border-b border-border">
        <h1 className="text-4xl font-bold font-headline text-primary">{category?.name || 'Category'}</h1>
        {category?.description && <p className="mt-2 text-lg text-muted-foreground">{category.description}</p>}
      </div>
      
      {error && products.length === 0 && ( 
         <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Products</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">Try Again</Button>
        </div>
      )}


      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        !isLoading && !error && slug && ( 
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No products found in the category "{category?.name || slug}". Check back soon!
            </p>
          </div>
        )
      )}
    </div>
  );
}
