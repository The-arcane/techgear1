import { ProductCard } from '@/components/products/ProductCard';
import { getProductsByCategory, getCategoryBySlug, categories }      from '@/lib/data';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type CategoryPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = getCategoryBySlug(params.slug);
  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }
  return {
    title: `${category.name} | TechGear`,
    description: `Browse ${category.name} at TechGear. ${category.description}`,
  };
}

// Static paths for categories
export async function generateStaticParams() {
  return categories.map((category) => ({
    slug: category.slug,
  }));
}


export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;
  const products = getProductsByCategory(slug);
  const category = getCategoryBySlug(slug);

  if (!category) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
        <p className="text-muted-foreground">
          The category you are looking for does not exist.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Back to Home
          </button>
        </Link>
      </div>
    );
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

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            No products found in this category yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
