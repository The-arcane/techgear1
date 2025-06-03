"use client";

import type { CartItem, Product } from '@/lib/types';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem('techgear-cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('techgear-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantityToAdd;
        if (newQuantity > product.stock) {
          toast({ title: "Stock limit reached", description: `Cannot add more than ${product.stock} units.`, variant: "destructive" });
          return prevItems.map(item =>
            item.productId === product.id ? { ...item, quantity: product.stock } : item
          );
        }
        return prevItems.map(item =>
          item.productId === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (quantityToAdd > product.stock) {
          toast({ title: "Stock limit reached", description: `Cannot add more than ${product.stock} units.`, variant: "destructive" });
           return [...prevItems, { productId: product.id, name: product.name, price: product.price, quantity: product.stock, image: product.images[0], stock: product.stock }];
        }
        return [...prevItems, { productId: product.id, name: product.name, price: product.price, quantity: quantityToAdd, image: product.images[0], stock: product.stock }];
      }
    });
    toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({ title: "Removed from cart", description: "Item removed from your cart." });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.productId === productId) {
          if (quantity <= 0) {
            toast({ title: "Item removed", description: "Quantity set to 0, item removed.", variant: "destructive" });
            return null; // Mark for removal
          }
          if (quantity > item.stock) {
            toast({ title: "Stock limit reached", description: `Max quantity is ${item.stock}.`, variant: "destructive" });
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity };
        }
        return item;
      }).filter(item => item !== null) as CartItem[] // Filter out null items
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast({ title: "Cart cleared", description: "Your shopping cart is now empty." });
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};
