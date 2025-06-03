
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary group">
      <CardHeader className="p-0">
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <Image
              src={product.images[0]}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={`${product.categorySlug} ${product.name.split(' ')[0]}`}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/products/${product.id}`} className="block">
          <CardTitle className="text-lg font-headline mb-1 group-hover:text-primary transition-colors truncate" title={product.name}>
            {product.name}
          </CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground h-10 overflow-hidden mb-2">
          {product.description.substring(0, 60)}...
        </p>
        <p className="text-xl font-semibold text-primary">
          ₹{product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="w-full flex items-center justify-between gap-2">
           <Link href={`/products/${product.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {/* AddToCartButton can be placed here if direct add from list is desired */}
          {/* For now, linking to product page for adding to cart */}
        </div>
      </CardFooter>
    </Card>
  );
}
