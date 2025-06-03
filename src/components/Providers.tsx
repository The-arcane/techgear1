"use client";

import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from '@/components/ui/toaster';
import type { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <CartProvider>
      {children}
      <Toaster />
    </CartProvider>
  );
}
