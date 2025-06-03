
"use client";

import { useCart } from '@/contexts/CartContext';
import { CartItemCard } from './CartItemCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShoppingCart, Trash2 } from 'lucide-react';

export function CartView() {
  const { cartItems, getCartTotal, clearCart, itemCount } = useCart();

  if (itemCount === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-semibold mb-2">Your Cart is Empty</h2>
        <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start">
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-headline">Your Shopping Cart ({itemCount} items)</CardTitle>
          <Button variant="outline" size="sm" onClick={clearCart} disabled={itemCount === 0}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {cartItems.map(item => (
            <CartItemCard key={item.productId} item={item} />
          ))}
        </CardContent>
      </Card>

      <Card className="sticky top-24"> {/* Make summary sticky */}
        <CardHeader>
          <CardTitle className="text-xl font-headline">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>₹{getCartTotal().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>Free</span> {/* Placeholder */}
          </div>
          <hr />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₹{getCartTotal().toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/checkout" className="w-full">
            <Button size="lg" className="w-full">
              Proceed to Checkout
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
