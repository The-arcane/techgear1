
"use client";

import React, { useState, useEffect, useRef } from 'react'; // Ensure React is imported first
import Link from 'next/link';
import { ShoppingCart, User, LogIn, Menu, PackageSearch, LogOut, X as CloseIcon, ChevronDown, ListOrdered, UserCircle as UserProfileIcon, Loader2 } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabaseClient';
import type { User as AuthUser } from '@supabase/supabase-js';

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
  const initialAuthCheckDone = useRef(false);
  
  const router = useRouter();

  useEffect(() => {
    console.log("Header: useEffect mounted. isLoadingAuth initially:", isLoadingAuth);
    setIsLoadingAuth(true); // Set loading true when effect runs
    initialAuthCheckDone.current = false;

    const fetchUserDetails = async (user: AuthUser) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no row found, which is fine
          console.error("Header: Error fetching profile:", profileError.message);
        }
        setUserName(profileData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "User");

        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (adminError) {
          console.error("Header: Error checking admin status:", adminError.message);
          setIsAdminUser(false);
        } else {
          setIsAdminUser(!!adminData);
        }
      } catch (e: any) {
        console.error("Header: Unexpected error in fetchUserDetails:", e.message);
        setUserName(user.email?.split('@')[0] || "User"); // Fallback
        setIsAdminUser(false);
      }
    };
    
    // Function to handle setting user state and then ensuring loading is false
    const handleUserSession = async (user: AuthUser | null) => {
      setAuthUser(user);
      if (user) {
        await fetchUserDetails(user);
      } else {
        setUserName(null);
        setIsAdminUser(false);
      }
      if (!initialAuthCheckDone.current) {
        setIsLoadingAuth(false);
        initialAuthCheckDone.current = true;
        console.log("Header: Initial auth check complete (from handleUserSession), isLoadingAuth set to false.");
      }
    };

    // Perform initial auth check
    const performInitialAuthSetup = async () => {
      console.log("Header: Performing initial auth setup.");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Header (initial getSession): Session object:", session ? session.user.id : "null");
        await handleUserSession(session?.user ?? null);
      } catch (e:any) {
        console.error("Header (initial auth setup error):", e.message);
        await handleUserSession(null); // Ensure loading state is handled even on error
      }
    };

    performInitialAuthSetup();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Header: onAuthStateChange event:", event, "Session user:", session?.user?.id || "null");
      await handleUserSession(session?.user ?? null);
    });

    return () => {
      console.log("Header: useEffect cleanup. Unsubscribing auth listener.");
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    setIsLoadingAuth(true); // Show loading during logout process
    const { error } = await supabase.auth.signOut();
    closeMobileMenu();
    if (error) {
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // Auth state will be updated by onAuthStateChange, which will also set isLoadingAuth false.
    }
    router.push('/login'); 
    router.refresh(); 
  };
  

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

          <div className="hidden md:flex items-center space-x-2">
            {isLoadingAuth ? (
              <Button variant="ghost" size="sm" disabled className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </Button>
            ) : authUser ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="My Account" className="flex items-center">
                      <User className="h-5 w-5 mr-1" /> 
                      {userName ? <span className="text-sm truncate max-w-[100px]">{userName.split(' ')[0]}</span> : 'Account'}
                       <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full">
                        <UserProfileIcon className="mr-2 h-4 w-4" /> My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                       <Link href="/orders" className="flex items-center w-full">
                        <ListOrdered className="mr-2 h-4 w-4" /> Order History
                      </Link>
                    </DropdownMenuItem>
                    {isAdminUser && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center w-full">
                            <PackageSearch className="mr-2 h-4 w-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center w-full cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                       <p className="py-2 text-lg font-medium text-muted-foreground flex items-center">
                         <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading user...
                       </p>
                    ): authUser ? (
                      <>
                        <p className="py-2 text-lg font-medium text-foreground flex items-center">
                           <User className="mr-2 h-5 w-5" /> {userName || 'My Account'}
                        </p>
                        <div className="flex flex-col space-y-1 pl-3 border-l border-muted">
                          <Link href="/profile" onClick={closeMobileMenu} className="py-1.5 text-md text-foreground/80 hover:text-primary transition-colors flex items-center">
                            <UserProfileIcon className="mr-2 h-4 w-4" /> My Profile
                          </Link>
                          <Link href="/orders" onClick={closeMobileMenu} className="py-1.5 text-md text-foreground/80 hover:text-primary transition-colors flex items-center">
                              <ListOrdered className="mr-2 h-4 w-4" /> Order History
                          </Link>
                          {isAdminUser && (
                            <Link href="/admin" onClick={closeMobileMenu} className="py-1.5 text-md text-foreground/80 hover:text-primary transition-colors flex items-center">
                                <PackageSearch className="mr-2 h-4 w-4" /> Admin Panel
                            </Link>
                          )}
                        </div>
                        <Button variant="outline" onClick={handleLogout} className="w-full justify-start text-lg py-3 mt-4">
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

