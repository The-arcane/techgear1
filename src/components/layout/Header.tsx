
"use client";

import React from 'react'; // Ensure React is imported first
import Link from 'next/link';
import { ShoppingCart, User, LogIn, Menu, PackageSearch, LogOut, X as CloseIcon, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react'; // Separate from default React import
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { User as AuthUser } from '@supabase/supabase-js';
import type { SupabaseAdmin } from '@/lib/types';

const mainNavLinks = [
  { href: '/', label: 'Home' },
];

const categoryNavLinks = [
  { href: '/products', label: 'All Products' },
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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    const getSessionAndUser = async () => {
      setIsLoadingAuth(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        setIsLoadingAuth(false);
        return;
      }
      
      const user = session?.user ?? null;
      setAuthUser(user);

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: row not found
          console.error("Error fetching profile:", profileError.message);
        }
        setUserName(profileData?.full_name || user.user_metadata?.full_name || user.email || null);

        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (adminError) {
          console.error("Error checking admin status:", adminError.message);
          setIsAdminUser(false);
        } else {
          setIsAdminUser(!!adminData);
        }
      } else {
        setUserName(null);
        setIsAdminUser(false);
      }
      setIsLoadingAuth(false);
    };

    getSessionAndUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoadingAuth(true);
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user) {
         const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile on auth change:", profileError.message);
        }
        setUserName(profileData?.full_name || user.user_metadata?.full_name || user.email || null);
        
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        
        if (adminError) {
          console.error("Error checking admin status on auth change:", adminError.message);
          setIsAdminUser(false);
        } else {
          setIsAdminUser(!!adminData);
        }
      } else {
        setUserName(null);
        setIsAdminUser(false);
      }
      setIsLoadingAuth(false);
      // router.refresh(); // Refresh to update server components if needed, but be cautious with layout shifts
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    closeMobileMenu();
    if (error) {
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // Auth state will update via onAuthStateChange listener
    }
    // No need to manually setAuthUser, setIsAdminUser, setUserName here as onAuthStateChange handles it.
    router.push('/login'); 
    router.refresh(); 
    setIsLoadingAuth(false);
  };
  
  const CartLinkPlaceholder = () => (
    <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative" disabled>
      <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
    </Button>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
          {mainNavLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                Categories <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {categoryNavLinks.map((link, index) => (
                <React.Fragment key={link.href}>
                  {link.label === "All Products" && index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem asChild>
                    <Link href={link.href} className="w-full">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {!isLoadingAuth ? (
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
            {isLoadingAuth ? (
              <Button variant="ghost" size="sm" disabled><LogIn className="mr-2 h-4 w-4" /> Loading...</Button>
            ) : authUser ? (
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
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" /> Login
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
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background overflow-y-auto">
                <div className="p-6">
                  <div className="mb-6 flex justify-between items-center">
                    <Logo />
                     <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="md:hidden">
                        <CloseIcon className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                  <nav className="flex flex-col space-y-2">
                    {mainNavLinks.map(link => (
                      <Link 
                        key={`mobile-${link.href}`} 
                        href={link.href} 
                        onClick={closeMobileMenu} 
                        className="block py-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    
                    <div className="py-2">
                      <p className="text-lg font-medium text-foreground mb-1">Categories</p>
                      <div className="flex flex-col space-y-1 pl-3 border-l border-muted">
                        {categoryNavLinks.map(link => (
                          <Link 
                            key={`mobile-cat-${link.href}`} 
                            href={link.href} 
                            onClick={closeMobileMenu} 
                            className="block py-1.5 text-md text-foreground/80 hover:text-primary transition-colors"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    
                    <hr className="my-4"/>

                    {isLoadingAuth ? (
                       <p className="py-2 text-lg font-medium text-muted-foreground flex items-center">Loading user...</p>
                    ): authUser ? (
                      <>
                        <Link href="/orders" onClick={closeMobileMenu} className="py-2 text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                           <User className="mr-2 h-5 w-5" /> {userName || 'My Orders'}
                        </Link>
                        {isAdminUser && (
                          <Link href="/admin" onClick={closeMobileMenu} className="py-2 text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                              <PackageSearch className="mr-2 h-5 w-5" /> Admin Panel
                          </Link>
                        )}
                        <Button variant="outline" onClick={handleLogout} className="w-full justify-start text-lg py-3 mt-2">
                          <LogOut className="mr-2 h-5 w-5" /> Logout
                        </Button>
                      </>
                    ) : (
                      <Link href="/login" onClick={closeMobileMenu} className="py-2 text-lg font-medium text-foreground hover:text-primary transition-colors flex items-center">
                         <LogIn className="mr-2 h-5 w-5" /> Login / Signup
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
