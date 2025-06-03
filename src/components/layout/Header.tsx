
"use client";

import Link from 'next/link';
import { ShoppingCart, User, LogIn, Menu, PackageSearch, LogOut, X } from 'lucide-react'; // Added X here
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
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname(); 

  useEffect(() => {
    setIsClient(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('authUser') : null;
    
    if (token && storedUser) {
      setIsAuthenticated(true);
      try {
        const user = JSON.parse(storedUser);
        setUserName(user?.name || user?.email || null);
        if (user && user.role === 'admin') {
          setIsAdminUser(true);
        } else {
          setIsAdminUser(false);
        }
      } catch (e) {
        console.error("Failed to parse authUser from localStorage", e);
        setIsAdminUser(false);
        setUserName(null);
      }
    } else {
      setIsAuthenticated(false);
      setIsAdminUser(false);
      setUserName(null);
    }
  }, [pathname]); 

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
    setIsAuthenticated(false);
    setIsAdminUser(false);
    setUserName(null);
    closeMobileMenu();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
    // router.refresh(); // Not always needed after push, can cause extra renders
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
          {isClient ? (
            <Link href="/cart" passHref legacyBehavior={false}>
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
            {isClient && isAuthenticated ? (
              <>
                <Link href="/orders">
                  <Button variant="ghost" size="sm" aria-label="My Account" className="flex items-center">
                    <User className="h-5 w-5 mr-1" /> {userName ? <span className="text-sm truncate max-w-[100px]">{userName.split(' ')[0]}</span> : 'Account'}
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
            ) : isClient ? (
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
                        <X className="h-6 w-6" /> {/* Ensure X is imported and used */}
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
                    {isClient && isAuthenticated ? (
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
                    ) : isClient ? (
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
