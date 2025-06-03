
"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackagePlus, ListOrdered, Settings, Users, LayoutGrid, Loader2, ShieldAlert, LogIn } from "lucide-react";
import { getAllOrders } from "@/lib/data"; // Ensure this is appropriate or replace with actual data fetching
import type { Order } from "@/lib/types";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import type { User as AuthUserType } from '@supabase/supabase-js';

export default function AdminPage() {
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const initialAuthProcessed = useRef(false); // Tracks if onAuthStateChange has run at least once

  useEffect(() => {
    let isMounted = true;
    console.log("AdminPage: useEffect mounted. Preview Debug.");

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) {
        console.log("AdminPage: onAuthStateChange - component unmounted, aborting. Preview Debug.");
        return;
      }
      console.log("AdminPage: onAuthStateChange event:", event, "Session user:", session?.user?.id || "None", ". Preview Debug.");
      
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);

      if (currentUser) {
        console.log(`AdminPage: onAuthStateChange - User found: ${currentUser.id}. Checking admin status. Preview Debug.`);
        try {
          // This is the critical admin check
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('id')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (!isMounted) return;

          if (adminError) {
            console.error("AdminPage: onAuthStateChange - Error checking 'admins' table:", adminError.message, "Preview Debug.");
            setIsAdmin(false);
          } else {
            const isAdminUser = !!adminData;
            setIsAdmin(isAdminUser);
            console.log(`AdminPage: onAuthStateChange - User ${currentUser.email} admin status: ${isAdminUser}. adminData:`, JSON.stringify(adminData) , "Preview Debug.");
          }
        } catch (e: any) {
          if (!isMounted) return;
          console.error("AdminPage: onAuthStateChange - Exception checking 'admins' table:", e.message, "Preview Debug.");
          setIsAdmin(false);
        }
      } else {
        console.log("AdminPage: onAuthStateChange - No user session. Setting isAdmin to false. Preview Debug.");
        setIsAdmin(false);
      }
      
      // Mark that the initial auth state has been processed and set loading to false
      if (!initialAuthProcessed.current) {
        initialAuthProcessed.current = true;
      }
      setIsLoading(false); 
    });

    // Fallback for environments where onAuthStateChange might not fire initially as expected
    // or if there's no existing session.
    // This helps ensure isLoading is eventually set to false.
    const checkInitialUser = async () => {
        if (initialAuthProcessed.current) return; // Already handled by onAuthStateChange
        console.log("AdminPage: checkInitialUser - Running fallback initial user check. Preview Debug.");
        const {data: { user: initialUser }} = await supabase.auth.getUser();
        if (!initialUser && !initialAuthProcessed.current) {
            console.log("AdminPage: checkInitialUser - No initial user and onAuthStateChange hasn't run. Setting loading false. Preview Debug.");
            setIsLoading(false);
            initialAuthProcessed.current = true; // Mark as processed
        } else if (initialUser && !initialAuthProcessed.current) {
             console.log("AdminPage: checkInitialUser - Found initial user but onAuthStateChange hasn't run. Waiting for onAuthStateChange. Preview Debug.");
             // onAuthStateChange should pick this up and set loading to false.
        }
    };
    // Give onAuthStateChange a moment to fire first
    const timer = setTimeout(checkInitialUser, 500);


    return () => {
      isMounted = false;
      clearTimeout(timer);
      console.log("AdminPage: useEffect cleanup - Unsubscribing auth listener. Preview Debug.");
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once on mount and cleanup on unmount.

  // Derived state for redirection logic
  // Redirect only if loading is complete, initial auth has been processed, and there's no user.
  const shouldRedirectToLogin = !isLoading && initialAuthProcessed.current && !authUser;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      console.log("AdminPage: Derived state indicates redirection to login. isLoading:", isLoading, "initialAuthProcessed:", initialAuthProcessed.current, "authUser:", !!authUser, "Preview Debug.");
      router.push('/admin/login');
    }
  }, [shouldRedirectToLogin, router, isLoading, authUser]);


  const allMockOrders = getAllOrders(); 
  const totalProducts = 0; 
  const totalOrders = allMockOrders.length;

  const orderStatusCounts = allMockOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<Order['status'], number>);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying admin access (Preview Debug)...</p>
      </div>
    );
  }

  if (shouldRedirectToLogin) {
     // This state is primarily for the visual feedback during the brief moment before redirection.
     // The actual redirection is handled by the useEffect above.
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LogIn className="h-12 w-12 text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to admin login (Preview Debug)...</p>
      </div>
    );
  }
  
  // This case: user is authenticated (authUser is not null) but not an admin.
  if (authUser && !isAdmin) {
    console.log(`AdminPage: Access Denied. User ${authUser.email} is authenticated but NOT an admin. isLoading: ${isLoading}, isAdmin: ${isAdmin}. Preview Debug.`);
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
  
  // This case: user is authenticated AND is an admin.
  if (authUser && isAdmin) {
    console.log(`AdminPage: Rendering admin panel for ${authUser.email}. isAdmin: ${isAdmin}. isLoading: ${isLoading}. Preview Debug.`);
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

  // Fallback: If not loading, and not explicitly redirecting or rendering content,
  // this might indicate an unhandled state. Could show a generic loading/error or null.
  console.log("AdminPage: Reached fallback render. isLoading:", isLoading, "authUser:", !!authUser, "isAdmin:", isAdmin, "initialAuthProcessed:", initialAuthProcessed.current, "Preview Debug.");
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Checking session state...</p>
    </div>
  );
}
