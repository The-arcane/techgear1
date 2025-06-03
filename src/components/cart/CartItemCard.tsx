
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { CartItem } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Minus, Plus } from 'lucide-react';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.productId, newQuantity);
  };

  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <Link href={`/products/${item.productId}`}>
        <div className="relative w-20 h-20 rounded-md overflow-hidden cursor-pointer">
          <Image
            src={item.image}
            alt={item.name}
            layout="fill"
            objectFit="cover"
             data-ai-hint="product image"
          />
        </div>
      </Link>
      <div className="flex-grow">
        <Link href={`/products/${item.productId}`}>
          <h3 className="font-medium hover:text-primary transition-colors">{item.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.quantity - 1)} disabled={item.quantity <= 1}>
          <Minus className="h-4 w-4" />
          <span className="sr-only">Decrease quantity</span>
        </Button>
        <Input
          type="number"
          min="1"
          max={item.stock}
          value={item.quantity}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val > 0) {
              handleQuantityChange(val);
            } else if (e.target.value === "") {
               // Allow empty input temporarily, handle on blur or if they type 0
            }
          }}
          onBlur={(e) => { // Handle case where input is left empty or 0
            const val = parseInt(e.target.value);
            if (isNaN(val) || val <=0) {
              handleQuantityChange(1); // Reset to 1 if invalid
            }
          }}
          className="w-16 h-9 text-center"
          aria-label="Quantity"
        />
        <Button variant="outline" size="icon" onClick={() => handleQuantityChange(item.quantity + 1)} disabled={item.quantity >= item.stock}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Increase quantity</span>
        </Button>
      </div>
      <div className="text-right font-medium w-24">
        ₹{(item.price * item.quantity).toFixed(2)}
      </div>
      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.productId)} aria-label="Remove item">
        <X className="h-5 w-5 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}
