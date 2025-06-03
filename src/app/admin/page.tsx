
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
  const [statsError, setStatsError] = useState<string | null>(null);
  const [storeStats, setStoreStats] = useState<StoreStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const router = useRouter();
  const isMounted = useRef(false);
  const initialAuthCheckDone = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    console.log("[AdminPage] Component mounted.");
    return () => {
      isMounted.current = false;
      console.log("[AdminPage] Component unmounted.");
    };
  }, []);

  const fetchStoreStats = async () => {
    if (!isMounted.current || !isAdmin || !authUser) {
      console.log("[AdminPage] fetchStoreStats: Skipped, conditions not met (isMounted:", isMounted.current, "isAdmin:", isAdmin, "authUser:", !!authUser, ")");
      if (isMounted.current) setIsLoadingStats(false);
      return;
    }

    console.log("[AdminPage] fetchStoreStats: Starting to fetch stats for admin:", authUser.id);
    setIsLoadingStats(true);
    setStatsError(null);
    const startTime = Date.now();
    try {
      console.log("[AdminPage] fetchStoreStats: Fetching total products...");
      const productsQueryStartTime = Date.now();
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      console.log(`[AdminPage] fetchStoreStats: Products query took ${Date.now() - productsQueryStartTime}ms. Raw productsCount: ${productsCount}. Error:`, productsError);
      if (productsError) throw new Error(`Products fetch error: ${productsError.message}`);

      console.log("[AdminPage] fetchStoreStats: Fetching total orders...");
      const ordersQueryStartTime = Date.now();
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      console.log(`[AdminPage] fetchStoreStats: Total orders query took ${Date.now() - ordersQueryStartTime}ms. Raw ordersCount: ${ordersCount}. Error:`, ordersError);
      if (ordersError) throw new Error(`Total orders fetch error: ${ordersError.message}`);
      
      console.log("[AdminPage] fetchStoreStats: Fetching pending orders...");
      const pendingQueryStartTime = Date.now();
      const { count: pendingOrdersCount, error: pendingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending' as OrderStatus);
      console.log(`[AdminPage] fetchStoreStats: Pending orders query took ${Date.now() - pendingQueryStartTime}ms. Raw pendingOrdersCount: ${pendingOrdersCount}. Error:`, pendingError);
      if (pendingError) throw new Error(`Pending orders fetch error: ${pendingError.message}`);

      console.log("[AdminPage] fetchStoreStats: Fetching completed orders...");
      const completedQueryStartTime = Date.now();
      const { count: completedOrdersCount, error: completedError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Delivered' as OrderStatus);
      console.log(`[AdminPage] fetchStoreStats: Completed orders query took ${Date.now() - completedQueryStartTime}ms. Raw completedOrdersCount: ${completedOrdersCount}. Error:`, completedError);
      if (completedError) throw new Error(`Completed orders fetch error: ${completedError.message}`);
      
      if (isMounted.current) {
        const newStats = {
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          pendingOrders: pendingOrdersCount || 0,
          completedOrders: completedOrdersCount || 0,
        };
        setStoreStats(newStats);
        console.log("[AdminPage] fetchStoreStats: Stats updated in state.", newStats);
      }
    } catch (error: any) {
      console.error("[AdminPage] fetchStoreStats: Error fetching store stats:", error.message, error);
      if (isMounted.current) {
        setStatsError(error.message || "Failed to load store statistics.");
        setStoreStats({ totalProducts: 0, totalOrders: 0, pendingOrders: 0, completedOrders: 0 });
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingStats(false);
        console.log(`[AdminPage] fetchStoreStats: Finished. Total time: ${Date.now() - startTime}ms. isLoadingStats set to false.`);
      }
    }
  };

  useEffect(() => {
    let isEffectSubscribed = true;
    console.log("[AdminPage] Auth useEffect: Running. isLoadingAuth:", isLoadingAuth, "initialAuthCheckDone:", initialAuthCheckDone.current);

    if (!initialAuthCheckDone.current) {
        setIsLoadingAuth(true);
    }

    const checkAdminStatusAndSetUser = async (user: AuthUserType | null) => {
      if (!isEffectSubscribed || !isMounted.current) return;
      setAuthUser(user);

      if (user) {
        console.log("[AdminPage] Auth useEffect: User found (ID:", user.id, "), checking admin status.");
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (!isEffectSubscribed || !isMounted.current) return;

          if (adminError) {
            console.error("[AdminPage] Auth useEffect: Error checking admin status:", adminError.message);
            setIsAdmin(false);
          } else {
            const isAdminUser = !!adminData;
            setIsAdmin(isAdminUser);
            console.log("[AdminPage] Auth useEffect: isAdmin state set to:", isAdminUser);
          }
        } catch (e: any) {
          if (!isEffectSubscribed || !isMounted.current) return;
          console.error("[AdminPage] Auth useEffect: Exception checking admin status:", e.message);
          setIsAdmin(false);
        }
      } else {
        console.log("[AdminPage] Auth useEffect: No user found.");
        setIsAdmin(false);
      }
      
      if (isEffectSubscribed && isMounted.current && !initialAuthCheckDone.current) {
        setIsLoadingAuth(false);
        initialAuthCheckDone.current = true;
        console.log("[AdminPage] Auth useEffect: Initial auth sequence complete. isLoadingAuth set to false.");
      }
    };
    
    if (!initialAuthCheckDone.current) {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (!isEffectSubscribed || !isMounted.current) return;
          console.log("[AdminPage] Auth useEffect: Initial getSession. User:", session?.user?.id || "None");
          await checkAdminStatusAndSetUser(session?.user ?? null);
        }).catch((err) => {
          if (!isEffectSubscribed || !isMounted.current) return;
          console.error("[AdminPage] Auth useEffect: Error in initial getSession:", err.message);
          checkAdminStatusAndSetUser(null); 
           if (isEffectSubscribed && isMounted.current && !initialAuthCheckDone.current) {
            setIsLoadingAuth(false);
            initialAuthCheckDone.current = true;
            console.log("[AdminPage] Auth useEffect: Initial getSession errored. isLoadingAuth set to false.");
          }
        });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isEffectSubscribed || !isMounted.current) return;
      console.log("[AdminPage] Auth useEffect: onAuthStateChange event:", event, "Session User ID:", session?.user?.id || "None");
      
      const wasLoadingAuth = isLoadingAuth;
      await checkAdminStatusAndSetUser(session?.user ?? null);
      
      if (isEffectSubscribed && isMounted.current && !initialAuthCheckDone.current && wasLoadingAuth) {
          setIsLoadingAuth(false);
          initialAuthCheckDone.current = true;
          console.log("[AdminPage] Auth useEffect: Initial auth confirmation via onAuthStateChange. isLoadingAuth set to false.");
      }
    });

    return () => {
      isEffectSubscribed = false;
      console.log("[AdminPage] Auth useEffect: Cleaning up. Unsubscribing auth listener.");
      authListener?.subscription.unsubscribe();
    };
  }, []); 

  useEffect(() => {
    if (isMounted.current && isAdmin && authUser && !isLoadingAuth) {
      console.log("[AdminPage] Stats useEffect: isAdmin is true, authUser exists, not loading auth. Calling fetchStoreStats.");
      fetchStoreStats();
    } else if (isMounted.current && !isLoadingAuth) { 
      console.log("[AdminPage] Stats useEffect: Conditions NOT met for fetching stats (isAdmin:", isAdmin, ", authUser:", !!authUser, ", isLoadingAuth:", isLoadingAuth, ")");
    }
  }, [isAdmin, authUser, isLoadingAuth]); 

  useEffect(() => {
    if (!isLoadingAuth && !authUser && isMounted.current && initialAuthCheckDone.current) {
      console.log("[AdminPage] Redirect useEffect: Not loading auth, no authUser, initial check done. Redirecting to /admin/login.");
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
  
  if (authUser && isAdmin) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Welcome, {authUser?.email}</p>
        
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
        
        <Card className="shadow-lg">
          <CardHeader>
             <CardTitle className="text-xl font-semibold font-headline">Store Overview</CardTitle>
             <CardDescription>Live store statistics from the database.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats && !statsError && (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading stats...</p>
              </div>
            )}
            {statsError && (
                 <div className="text-center py-8 text-destructive">
                    <ShieldAlert className="mx-auto h-8 w-8 mb-2" />
                    <p className="font-semibold">Error loading statistics</p>
                    <p className="text-sm">{statsError}</p>
                    <Button onClick={fetchStoreStats} className="mt-3" variant="outline" size="sm" disabled={isLoadingStats}>Retry Stats</Button>
                </div>
            )}
            {!isLoadingStats && !statsError && (
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Initializing admin panel...</p>
    </div>
  );
}
    
