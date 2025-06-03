
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackagePlus, ListOrdered, Settings, Users, LayoutGrid, Loader2, ShieldAlert, LogIn } from "lucide-react";
import { products, getAllOrders } from "@/lib/data"; 
import type { Order } from "@/lib/types";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { User as AuthUserType } from '@supabase/supabase-js';

export default function AdminPage() {
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); 
  const [isLoading, setIsLoading] = useState(true); // Start true, set to false only after auth check
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    console.log("AdminPage: useEffect mounted.");

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        console.log("AdminPage: onAuthStateChange - component unmounted, aborting.");
        return;
      }
      console.log("AdminPage: onAuthStateChange - Event:", event, "- Session User:", session?.user?.email || "None");

      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);

      if (currentUser) {
        console.log(`AdminPage: onAuthStateChange - User found: ${currentUser.email}. Checking admin status.`);
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!isMounted) return;

        if (adminError) {
          console.error("AdminPage: onAuthStateChange - Error checking 'admins' table:", adminError.message);
          setIsAdmin(false);
        } else {
          const isAdminUser = !!adminData;
          setIsAdmin(isAdminUser);
          if (!isAdminUser) {
            console.log(`AdminPage: onAuthStateChange - User ${currentUser.email} is authenticated but NOT an admin.`);
          } else {
            console.log(`AdminPage: onAuthStateChange - User ${currentUser.email} IS an admin.`);
          }
        }
      } else {
        console.log("AdminPage: onAuthStateChange - No user session.");
        setIsAdmin(false);
      }
      setIsLoading(false); // Auth check complete
    });

    // Initial check to see if user is already available (e.g. existing session)
    // This helps avoid delay if onAuthStateChange takes time for initial event
    // but isLoading will only be set to false by onAuthStateChange itself
    supabase.auth.getUser().then(async ({ data: { user: initialUser } }) => {
        if (!isMounted) return;
        if (initialUser && !authUser) { // If onAuthStateChange hasn't fired yet but getUser has a user
            console.log("AdminPage: Initial getUser() found user:", initialUser.email);
            setAuthUser(initialUser);
            const { data: adminData, error: adminError } = await supabase
              .from('admins')
              .select('id')
              .eq('id', initialUser.id)
              .maybeSingle();
            if (isMounted) {
                 if (adminError) {
                    console.error("AdminPage: Initial getUser() - Error checking 'admins' table:", adminError.message);
                    setIsAdmin(false);
                 } else {
                    setIsAdmin(!!adminData);
                 }
                 // Do not set isLoading false here, let onAuthStateChange handle it
                 // to ensure it's the definitive source.
            }
        } else if (!initialUser && !authUser) {
             console.log("AdminPage: Initial getUser() found no user and authUser state is also null.");
             // If onAuthStateChange doesn't fire quickly with a session, isLoading will remain true until it does.
             // If it fires with no session, isLoading becomes false, authUser null, isAdmin false -> redirect.
        }
    });


    return () => {
      isMounted = false;
      console.log("AdminPage: useEffect cleanup - Unsubscribing auth listener.");
      authListener?.subscription.unsubscribe();
    };
  }, []); // No dependencies, runs once on mount

  // Derived state for redirection logic
  const shouldRedirectToLogin = !isLoading && !authUser;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      console.log("AdminPage: Derived state indicates redirection to login.");
      router.push('/admin/login');
    }
  }, [shouldRedirectToLogin, router]);

  // Mock data for overview
  const allMockOrders = getAllOrders();
  const totalProducts = products.length;
  const totalOrders = allMockOrders.length;
  
  const orderStatusCounts = allMockOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<Order['status'], number>);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (shouldRedirectToLogin) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LogIn className="h-12 w-12 text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to admin login...</p>
      </div>
    );
  }
  
  if (!isAdmin && authUser) { 
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
  
  // If we are here, isLoading is false, authUser exists, and isAdmin is true.
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
            <CardDescription>View and manage user accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
             Category Management
            </CardTitle>
            <CardDescription>Add, edit, or delete categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/categories">
              <Button className="w-full">Manage Categories</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Store Settings
            </CardTitle>
            <CardDescription>Configure store preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/settings">
              <Button className="w-full">Configure Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 p-6 bg-card rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 font-headline">Store Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-3xl font-bold">{totalProducts}</p><p className="text-sm text-muted-foreground">Total Products</p></div>
            <div><p className="text-3xl font-bold">{totalOrders}</p><p className="text-sm text-muted-foreground">Total Orders</p></div>
            <div><p className="text-3xl font-bold">{orderStatusCounts['Pending'] || 0}</p><p className="text-sm text-muted-foreground">Pending Orders</p></div>
            <div><p className="text-3xl font-bold">{orderStatusCounts['Delivered'] || 0}</p><p className="text-sm text-muted-foreground">Completed Orders</p></div>
        </div>
      </div>
    </div>
  );
}
    