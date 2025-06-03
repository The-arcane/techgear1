
"use client";

import Link from 'next/link';
import { ShoppingCart, User, LogIn, Menu, PackageSearch, Zap, LogOut } from 'lucide-react'; // Added LogOut
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

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
  const [isAuthenticated, setIsAuthenticated] = useState(false); // General auth state
  const [isAdminUser, setIsAdminUser] = useState(false); // Specific admin auth state
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    // Check auth state from localStorage on mount
    if (typeof window !== 'undefined') {
      const adminStatus = localStorage.getItem('isAdmin') === 'true';
      const userAuthStatus = localStorage.getItem('isAuthenticated') === 'true'; // Assuming a general auth flag
      setIsAdminUser(adminStatus);
      setIsAuthenticated(userAuthStatus || adminStatus); // User is authenticated if they are admin or generally logged in
    }
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('isAuthenticated'); // Clear general auth flag too
    }
    setIsAdminUser(false);
    setIsAuthenticated(false);
    closeMobileMenu();
    router.push('/login'); // Redirect to login after logout
  };
  
  const CartLinkPlaceholder = () => (
    <div className="flex items-center justify-center h-10 w-10">
      <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} passHref legacyBehavior>
              <a className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                {link.label}
              </a>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
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
            {isClient && isAuthenticated ? (
              <>
                <Link href="/orders" passHref legacyBehavior>
                  <Button variant="ghost" size="icon" aria-label="My Account" asChild={false}>
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : isClient ? (
              <Link href="/login" passHref legacyBehavior>
                <Button variant="ghost" size="sm" asChild={false}>
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
              </Link>
            ) : null }
            {isClient && isAdminUser && (
               <Link href="/admin" passHref legacyBehavior={false}>
                <Button variant="outline" size="sm" asChild={false}>
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
                  <div className="mb-6">
                    <Logo />
                  </div>
                  <nav className="flex flex-col space-y-4">
                    {navLinks.map(link => (
                      <Link key={`mobile-${link.href}`} href={link.href} passHref legacyBehavior>
                        <a onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                          {link.label}
                        </a>
                      </Link>
                    ))}
                    <hr/>
                    {isClient && isAuthenticated ? (
                      <>
                        <Link href="/orders" passHref legacyBehavior>
                          <a onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                           <User className="mr-2 h-5 w-5" /> My Orders
                          </a>
                        </Link>
                        {isAdminUser && (
                          <Link href="/admin" passHref legacyBehavior={false}>
                            <a onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                              <PackageSearch className="mr-2 h-5 w-5" /> Admin Panel
                            </a>
                          </Link>
                        )}
                        <Button variant="outline" onClick={handleLogout} className="w-full justify-start text-lg py-6">
                          <LogOut className="mr-2 h-5 w-5" /> Logout
                        </Button>
                      </>
                    ) : isClient ? (
                      <Link href="/login" passHref legacyBehavior>
                        <a onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                         <LogIn className="mr-2 h-5 w-5" /> Login / Signup
                        </a>
                      </Link>
                    ) : null}
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
