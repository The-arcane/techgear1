
"use client";

import Link from 'next/link';
import { ShoppingCart, User, LogIn, Menu, PackageSearch, LogOut, X as CloseIcon } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { User as AuthUser } from '@supabase/supabase-js';

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
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname(); 

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user ?? null);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authUser) {
      // For user name, prioritize profile data if fetched, then user_metadata, then email
      // This part would typically involve fetching from your 'profiles' table
      // For now, using user_metadata.full_name or email
      setUserName(authUser.user_metadata?.full_name || authUser.email || null);
      
      // Admin check: This is a simplified check.
      // In a real app, use custom claims (e.g., authUser.app_metadata?.claims_admin)
      // or check a role from your 'profiles' or a dedicated 'user_roles' table.
      const isAdmin = authUser.email === 'raunaq.adlakha@gmail.com' || authUser.user_metadata?.role === 'admin';
      setIsAdminUser(isAdmin);

    } else {
      setUserName(null);
      setIsAdminUser(false);
    }
  }, [authUser]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    closeMobileMenu();
    if (error) {
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); // Redirect to login after logout
      router.refresh(); // Refresh to ensure layout updates
    }
  };
  
  const CartLinkPlaceholder = () => (
    <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative" disabled>
      <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
    </Button>
  );

  // Check if component has mounted to avoid hydration issues with authUser state
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {mounted ? (
            <Link href="/cart">
              <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
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
            {mounted && authUser ? (
              <>
                <Link href="/orders">
                  <Button variant="ghost" size="sm" aria-label="My Account" className="flex items-center">
                    <User className="h-5 w-5 mr-1" /> 
                    {userName ? <span className="text-sm truncate max-w-[100px]">{userName.split(' ')[0]}</span> : 'Account'}
                  </Button>
                </Link>
                {isAdminUser && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <PackageSearch className="mr-2 h-4 w-4" /> Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : mounted ? (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
              </Link>
            ) : <Button variant="ghost" size="sm" disabled><LogIn className="mr-2 h-4 w-4" /> Login</Button> }
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
                  <div className="mb-6 flex justify-between items-center">
                    <Logo />
                     <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="md:hidden">
                        <CloseIcon className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                  <nav className="flex flex-col space-y-4">
                    {navLinks.map(link => (
                      <Link 
                        key={`mobile-${link.href}`} 
                        href={link.href} 
                        onClick={closeMobileMenu} 
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <hr/>
                    {mounted && authUser ? (
                      <>
                        <Link href="/orders" onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                           <User className="mr-2 h-5 w-5" /> {userName || 'My Orders'}
                        </Link>
                        {isAdminUser && (
                          <Link href="/admin" onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                              <PackageSearch className="mr-2 h-5 w-5" /> Admin Panel
                          </Link>
                        )}
                        <Button variant="outline" onClick={handleLogout} className="w-full justify-start text-lg py-6">
                          <LogOut className="mr-2 h-5 w-5" /> Logout
                        </Button>
                      </>
                    ) : mounted ? (
                      <Link href="/login" onClick={closeMobileMenu} className="text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                         <LogIn className="mr-2 h-5 w-5" /> Login / Signup
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
