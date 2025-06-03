import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Laptop, Keyboard, Mouse, Smartphone, Headphones, Package as DefaultIcon } from 'lucide-react'; // Changed import style

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  // Map category names to lucide icons
  const iconMap: { [key: string]: React.ElementType } = {
    Laptops: Laptop,
    Keyboards: Keyboard,
    Mice: Mouse,
    'Mobile Chargers': Smartphone,
    Earphones: Headphones,
  };

  const IconComponent = iconMap[category.name] || DefaultIcon; // Use imported icons

  return (
    <Link href={`/category/${category.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary">
        <CardHeader className="p-4">
          <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden">
            <Image
              src={category.imageUrl}
              alt={category.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={`${category.name.toLowerCase()}`}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
               <IconComponent className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
          </div>
          <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">{category.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <CardDescription className="text-sm mb-4 h-10 overflow-hidden">
            {category.description || `Explore our range of ${category.name.toLowerCase()}.`}
          </CardDescription>
          <div className="flex items-center text-primary font-medium group-hover:underline">
            Shop Now <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
