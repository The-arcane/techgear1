
"use client"; // Make this a client component to fetch and filter data

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/products/ProductCard';
import { getCategoryBySlug, categories as mockCategories } from '@/lib/data'; // Keep mock for category details
import type { Product, Category } from '@/lib/types';
// import type { Metadata } from 'next'; // Metadata needs to be handled differently for client components
import Link from 'next/link';
import { ChevronRight, Loader2 } from 'lucide-react';

// export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
//   const category = getCategoryBySlug(params.slug);
//   if (!category) {
//     return {
//       title: 'Category Not Found',
//     };
//   }
//   return {
//     title: `${category.name} | TechGear`,
//     description: `Browse ${category.name} at TechGear. ${category.description}`,
//   };
// }

// Static paths for categories (can still be generated from mock data for routing)
// export async function generateStaticParams() {
//   return mockCategories.map((category) => ({
//     slug: category.slug,
//   }));
// }

type CategoryPageProps = {
  params: { slug: string };
};

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryDetails = () => {
      const cat = getCategoryBySlug(slug);
      if (cat) {
        setCategory(cat);
        // Set document title dynamically
        document.title = `${cat.name} | TechGear`;
      } else {
        setError("Category not found.");
      }
    };

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products`); // Relative path for client-side fetch
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.statusText}`);
        }
        const data = await res.json();
        const allProducts: Product[] = data.products || [];
        
        // Filter products by categorySlug
        const categoryProducts = allProducts.filter(p => p.categorySlug === slug);
        setProducts(categoryProducts);

      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryDetails();
    if (slug) {
      fetchProducts();
    } else {
      setError("Category slug is missing.");
      setIsLoading(false);
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading products...</p>
      </div>
    );
  }
  
  if (error && !category) { // If category itself not found
     return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive mb-4">Category Not Found</h1>
        <p className="text-muted-foreground">
          The category you are looking for ({slug}) does not exist.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Back to Home
          </button>
        </Link>
      </div>
    );
  }
  
  if (!category) { // Fallback if category somehow not set but no error earlier
    return <div className="text-center py-10">Category details could not be loaded.</div>
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
              <span className="ml-2 font-medium text-foreground">{category.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="pb-6 border-b border-border">
        <h1 className="text-4xl font-bold font-headline text-primary">{category.name}</h1>
        {category.description && <p className="mt-2 text-lg text-muted-foreground">{category.description}</p>}
      </div>
      
      {error && !products.length && ( // Show error if products fetch failed and list is empty
         <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Products</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
        </div>
      )}


      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        !isLoading && !error && ( // Only show if not loading and no error occurred during product fetch
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No products found in this category yet. Check back soon!
            </p>
          </div>
        )
      )}
    </div>
  );
}
