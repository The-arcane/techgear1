
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackagePlus, ListOrdered, Settings, Users, LayoutGrid, Loader2, ShieldAlert } from "lucide-react";
// import type { Metadata } from 'next'; // Metadata for client components is handled differently or in parent layouts
import { products, getAllOrders } from "@/lib/data"; // Mock data for stats, will be replaced later
import type { Order } from "@/lib/types";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// export const metadata: Metadata = { // Static metadata can be set in a parent layout
//   title: 'Admin Panel | TechGear',
//   description: 'Manage products, orders, and settings for TechGear.',
// };

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null for loading state
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        router.push('/admin/login'); // Redirect to admin login if not authenticated
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (adminError) {
        console.error("Error checking admin status:", adminError.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!adminData);
      }
      setIsLoading(false);
    };

    checkAdminStatus();
  }, [router]);

  // Mock data for overview, replace with API calls as backend develops
  const totalProducts = products.length; 
  const allOrders = getAllOrders();
  const totalOrders = allOrders.length;
  
  const orderStatusCounts = allOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<Order['status'], number>);


  if (isLoading || isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
        <Link href="/admin/login">
          <Button>Go to Admin Login</Button>
        </Link>
        <Link href="/" className="mt-2">
          <Button variant="outline">Go to Homepage</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Admin Panel</h1>
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
