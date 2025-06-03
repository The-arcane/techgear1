import { CategoryCard } from '@/components/products/CategoryCard';
import { categories } from '@/lib/data'; // Mock data

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-r from-primary/10 via-background to-accent/10 rounded-lg shadow-sm">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-4">
          Welcome to TechGear!
        </h1>
        <p className="text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
          Discover the latest and greatest in tech accessories. Quality gear for your digital life.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-semibold font-headline mb-8 text-center">
          Shop by Category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="py-12 text-center">
        <h2 className="text-3xl font-semibold font-headline mb-4">Why TechGear?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          We curate the best tech accessories, focusing on quality, innovation, and style.
          Enjoy seamless shopping and fast delivery.
        </p>
      </section>
    </div>
  );
}
