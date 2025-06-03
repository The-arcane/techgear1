
"use client";

import Link from 'next/link';
import { ShoppingCart, User, LogIn, Menu, PackageSearch } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/category/laptops', label: 'Laptops' },
  { href: '/category/keyboards', label: 'Keyboards' },
  { href: '/category/mice', label: 'Mice' },
  { href: '/category/mobile-chargers', label: 'Chargers' },
  { href: '/category/earphones', label: 'Earphones' },
  { href: '/category/accessories', label: 'Accessories' },
];

export function Header() {
  const { itemCount } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Placeholder for auth state - currently hardcoded
  const isAuthenticated = false;
  const isAdmin = false;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Placeholder for the cart link area before client hydration
  const CartLinkPlaceholder = () => (
    <div className="flex items-center justify-center h-10 w-10"> {/* Matches Button size="icon" */}
      <ShoppingCart className="h-5 w-5 text-muted-foreground/50" /> {/* Muted and non-interactive appearance */}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {isClient ? (
            <Link href="/cart" passHref legacyBehavior={false}>
              <Button variant="ghost" size="icon" aria-label="Shopping Cart" asChild={false} className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          ) : (
            <CartLinkPlaceholder />
          )}

          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <Link href="/orders">
                <Button variant="ghost" size="icon" aria-label="My Account">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
              </Link>
            )}
            {isAdmin && (
               <Link href="/admin">
                <Button variant="outline" size="sm">
                  <PackageSearch className="mr-2 h-4 w-4" /> Admin
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background">
                <div className="p-6">
                  <Logo />
                  <nav className="mt-8 flex flex-col space-y-4">
                    {navLinks.map(link => (
                      <Link key={`mobile-${link.href}`} href={link.href} onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    ))}
                    <hr/>
                    {/* 
                      If isAuthenticated or isAdmin become dynamic (e.g., from context),
                      these links would also need to be guarded by `isClient` 
                      or their parent structure deferred until client-side.
                      Currently, they are fine because the flags are hardcoded.
                    */}
                    {isAuthenticated ? (
                      <Link href="/orders" onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                        My Orders
                      </Link>
                    ) : (
                      <Link href="/login" onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                        Login / Signup
                      </Link>
                    )}
                     {isAdmin && (
                      <Link href="/admin" onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                        Admin Panel
                      </Link>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
