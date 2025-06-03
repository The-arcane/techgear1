import { CartView } from '@/components/cart/CartView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart | TechGear',
  description: 'Review items in your shopping cart and proceed to checkout.',
};

export default function CartPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-8">Shopping Cart</h1>
      <CartView />
    </div>
  );
}
