
"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackagePlus, ListOrdered, Settings, Users, LayoutGrid, Loader2, ShieldAlert, LogIn, ShoppingBasket, Clock, CheckCircle } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { User as AuthUserType } from '@supabase/supabase-js';

interface StoreStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

export default function AdminPage() {
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [storeStats, setStoreStats] = useState<StoreStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const router = useRouter();
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStoreStats = async () => {
    if (!isMounted.current || !isAdmin) return;
    console.log("[AdminPage] fetchStoreStats: Starting to fetch stats.");
    setIsLoadingStats(true);
    try {
      console.log("[AdminPage] fetchStoreStats: Fetching total products...");
      const productsQueryStartTime = Date.now();
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      console.log(`[AdminPage] fetchStoreStats: Products query took ${Date.now() - productsQueryStartTime}ms.`);
      if (productsError) throw productsError;

      console.log("[AdminPage] fetchStoreStats: Fetching total orders...");
      const ordersQueryStartTime = Date.now();
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      console.log(`[AdminPage] fetchStoreStats: Total orders query took ${Date.now() - ordersQueryStartTime}ms.`);
      if (ordersError) throw ordersError;
      
      console.log("[AdminPage] fetchStoreStats: Fetching pending orders...");
      const pendingQueryStartTime = Date.now();
      const { count: pendingOrdersCount, error: pendingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending' as OrderStatus);
      console.log(`[AdminPage] fetchStoreStats: Pending orders query took ${Date.now() - pendingQueryStartTime}ms.`);
      if (pendingError) throw pendingError;

      console.log("[AdminPage] fetchStoreStats: Fetching completed orders...");
      const completedQueryStartTime = Date.now();
      const { count: completedOrdersCount, error: completedError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Delivered' as OrderStatus);
      console.log(`[AdminPage] fetchStoreStats: Completed orders query took ${Date.now() - completedQueryStartTime}ms.`);
      if (completedError) throw completedError;
      
      if (isMounted.current) {
        setStoreStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          pendingOrders: pendingOrdersCount || 0,
          completedOrders: completedOrdersCount || 0,
        });
        console.log("[AdminPage] fetchStoreStats: Stats updated.", { productsCount, ordersCount, pendingOrdersCount, completedOrdersCount });
      }

    } catch (error: any) {
      console.error("[AdminPage] fetchStoreStats: Error fetching store stats:", error.message, error);
      // Optionally set an error state to display to the user
    } finally {
      if (isMounted.current) {
        setIsLoadingStats(false);
        console.log("[AdminPage] fetchStoreStats: Finished fetching stats. isLoadingStats set to false.");
      }
    }
  };

  useEffect(() => {
    let isSubscribed = true; // For cleanup: to avoid setting state on unmounted component
    setIsLoadingAuth(true);
    console.log("[AdminPage] Auth useEffect: Running, isLoadingAuth set to true.");

    const checkAuthAndFetchData = async (user: AuthUserType | null) => {
      if (!isSubscribed) return;
      setAuthUser(user);

      if (user) {
        console.log("[AdminPage] Auth useEffect: User found, checking admin status for ID:", user.id);
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (!isSubscribed) return;

          if (adminError) {
            console.error("[AdminPage] Auth useEffect: Error checking admin status:", adminError);
            setIsAdmin(false);
          } else {
            const isAdminUser = !!adminData;
            setIsAdmin(isAdminUser);
            console.log("[AdminPage] Auth useEffect: isAdminUser set to:", isAdminUser);
            if (isAdminUser) {
              fetchStoreStats(); 
            }
          }
        } catch (e: any) {
          if (!isSubscribed) return;
          console.error("[AdminPage] Auth useEffect: Exception checking admin status:", e);
          setIsAdmin(false);
        }
      } else {
        console.log("[AdminPage] Auth useEffect: No user found.");
        setIsAdmin(false);
      }
      
      if (isSubscribed) {
        setIsLoadingAuth(false);
        console.log("[AdminPage] Auth useEffect: Finished auth check. isLoadingAuth set to false.");
      }
    };
    
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isSubscribed) return;
      console.log("[AdminPage] Auth useEffect: Initial getSession result. User ID:", session?.user?.id || "None");
      await checkAuthAndFetchData(session?.user ?? null);
    }).catch((err) => {
      if (!isSubscribed) return;
      console.error("[AdminPage] Auth useEffect: Error in initial getSession:", err);
      checkAuthAndFetchData(null); // Proceed with no user
    });

    // Listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;
      console.log("[AdminPage] Auth useEffect: onAuthStateChange event:", event, "Session User ID:", session?.user?.id || "None");
      // setIsLoadingAuth is primarily for the initial load, not subsequent changes.
      // Re-checking admin status and fetching data if user changes.
      await checkAuthAndFetchData(session?.user ?? null);
    });

    return () => {
      isSubscribed = false;
      console.log("[AdminPage] Auth useEffect: Cleaning up. Unsubscribing auth listener.");
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs once on mount and cleans up on unmount


  useEffect(() => {
    if (!isLoadingAuth && !authUser && isMounted.current) {
      console.log("[AdminPage] Redirect useEffect: Not loading auth, no authUser. Redirecting to /admin/login.");
      router.push('/admin/login');
    }
  }, [isLoadingAuth, authUser, router]);


  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!authUser) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LogIn className="h-12 w-12 text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to admin login...</p>
      </div>
    );
  }
  
  if (authUser && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You are logged in as {authUser.email}, but you do not have permission to view the admin panel.</p>
        <Link href="/admin/login">
          <Button>Go to Admin Login</Button>
        </Link>
        <Link href="/" className="mt-2">
          <Button variant="outline">Go to Homepage</Button>
        </Link>
      </div>
    );
  }
  
  // Only render full admin panel if authUser and isAdmin are confirmed
  if (authUser && isAdmin) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Welcome, {authUser?.email}</p>
        
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackagePlus className="h-6 w-6 text-primary" />
                Product Management
              </CardTitle>
              <CardDescription>Add, edit, or delete products.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/products">
                <Button className="w-full">Manage Products</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-6 w-6 text-primary" />
                Order Management
              </CardTitle>
              <CardDescription>View and update customer orders.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/orders">
                  <Button className="w-full">Manage Orders</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>View and manage user accounts. (Coming Soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button className="w-full" disabled>Manage Users</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-6 w-6 text-primary" />
              Category Management
              </CardTitle>
              <CardDescription>Add, edit, or delete categories. (Coming Soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/categories">
                <Button className="w-full" disabled>Manage Categories</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Store Settings
              </CardTitle>
              <CardDescription>Configure store preferences. (Coming Soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/settings">
                <Button className="w-full" disabled>Configure Settings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Store Overview Section */}
        <Card className="shadow-lg">
          <CardHeader>
             <CardTitle className="text-xl font-semibold font-headline">Store Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading stats...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="p-4 bg-background rounded-lg shadow-sm">
                  <ShoppingBasket className="mx-auto h-8 w-8 text-primary mb-2" />
                  <p className="text-3xl font-bold">{storeStats.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
                <div className="p-4 bg-background rounded-lg shadow-sm">
                  <ListOrdered className="mx-auto h-8 w-8 text-accent mb-2" />
                  <p className="text-3xl font-bold">{storeStats.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="p-4 bg-background rounded-lg shadow-sm">
                  <Clock className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
                  <p className="text-3xl font-bold">{storeStats.pendingOrders}</p>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                </div>
                <div className="p-4 bg-background rounded-lg shadow-sm">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p className="text-3xl font-bold">{storeStats.completedOrders}</p>
                  <p className="text-sm text-muted-foreground">Completed Orders</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback: if still determining auth state but not explicitly loadingAuth (should be rare with new logic)
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Verifying session state...</p>
    </div>
  );
}
