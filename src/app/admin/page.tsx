
"use client";

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let isMounted = true;
    setIsLoadingAuth(true);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);

      if (currentUser) {
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('id')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (!isMounted) return;

          if (adminError) {
            setIsAdmin(false);
          } else {
            const isAdminUser = !!adminData;
            setIsAdmin(isAdminUser);
            if (isAdminUser) {
              fetchStoreStats(); // Fetch stats if admin
            }
          }
        } catch (e: any) {
          if (!isMounted) return;
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      if (isMounted) setIsLoadingAuth(false);
    });

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setAuthUser(currentUser);
        if (currentUser) {
            // check admin status for initial session
            try {
                const { data: adminData, error: adminError } = await supabase
                    .from('admins')
                    .select('id')
                    .eq('id', currentUser.id)
                    .maybeSingle();
                if (!isMounted) return;
                if (adminError) setIsAdmin(false);
                else {
                    const isAdminUser = !!adminData;
                    setIsAdmin(isAdminUser);
                    if (isAdminUser) fetchStoreStats();
                }
            } catch (e) { if (!isMounted) return; setIsAdmin(false); }
        }
        if (isMounted) setIsLoadingAuth(false);
    }).catch(() => {
        if(isMounted) setIsLoadingAuth(false);
    });


    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStoreStats = async () => {
    if (!isAdmin) return; // Should be redundant due to call site, but good check
    setIsLoadingStats(true);
    try {
      // Fetch total products
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (productsError) throw productsError;

      // Fetch total orders
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      if (ordersError) throw ordersError;
      
      // Fetch pending orders
      const { count: pendingOrdersCount, error: pendingError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending' as OrderStatus);
      if (pendingError) throw pendingError;

      // Fetch completed orders
      const { count: completedOrdersCount, error: completedError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Delivered' as OrderStatus);
      if (completedError) throw completedError;
      
      setStoreStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        completedOrders: completedOrdersCount || 0,
      });

    } catch (error: any) {
      console.error("Error fetching store stats:", error.message);
      // Optionally set an error state to display to the user
    } finally {
      setIsLoadingStats(false);
    }
  };


  useEffect(() => {
    if (!isLoadingAuth && !authUser) {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Verifying session state...</p>
    </div>
  );
}
