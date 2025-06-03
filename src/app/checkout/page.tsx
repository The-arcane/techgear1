import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { CartView } from '@/components/cart/CartView'; // To show a summary or an "empty cart" message
import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Checkout | TechGear',
  description: 'Complete your purchase at TechGear.',
};

export default function CheckoutPage() {
  return (
    <div className="space-y-8">
      <nav className="flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-2 text-sm">
          <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
          <li><ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" /></li>
          <li><Link href="/cart" className="text-muted-foreground hover:text-foreground">Cart</Link></li>
          <li><ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" /></li>
          <li><span className="font-medium text-foreground">Checkout</span></li>
        </ol>
      </nav>
      <h1 className="text-3xl font-bold font-headline">Checkout</h1>
      
      {/* Consider a two-column layout for larger screens: form on one side, order summary on other */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <CheckoutForm />
        </div>
        <div className="lg:col-span-1 hidden lg:block"> 
          {/* A mini cart summary could go here, for now it's part of CartView */}
          {/* <CartView />  -- This would show the full cart view again. A smaller summary is better. */}
          {/* For now, keeping it simple. The total is shown in CheckoutForm. */}
        </div>
      </div>
    </div>
  );
}
