"use client";

import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/lib/types';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  showIconOnly?: boolean;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AddToCartButton({ product, quantity = 1, showIconOnly = false, className, variant="default", size="default" }: AddToCartButtonProps) {
  const { addToCart, cartItems } = useCart();
  const [added, setAdded] = useState(false);

  const itemInCart = cartItems.find(item => item.productId === product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000); // Reset after 2 seconds
  };

  if (product.stock === 0) {
    return <Button variant="outline" size={size} disabled className={className}>Out of Stock</Button>;
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={added || (itemInCart && itemInCart.quantity >= product.stock)}
      variant={variant}
      size={size}
      className={className}
    >
      {added ? (
        <>
          <CheckCircle className={`h-5 w-5 ${!showIconOnly ? 'mr-2' : ''}`} />
          {!showIconOnly && 'Added!'}
        </>
      ) : (
        <>
          <ShoppingCart className={`h-5 w-5 ${!showIconOnly ? 'mr-2' : ''}`} />
          {!showIconOnly && 'Add to Cart'}
        </>
      )}
      {showIconOnly && <span className="sr-only">Add to Cart</span>}
    </Button>
  );
}
