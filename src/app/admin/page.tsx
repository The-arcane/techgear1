
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackagePlus, ListOrdered, Settings } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel | TechGear',
  description: 'Manage products, orders, and settings for TechGear.',
};

// Basic role check placeholder - in real app this would come from auth context/middleware
const isAdmin = true; 

export default function AdminPage() {

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Go to Homepage</Button>
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
                <Button className="w-full" variant="outline" disabled>Manage Orders (Coming Soon)</Button>
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
            <Button className="w-full" variant="outline" disabled>Configure Settings (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 p-4 bg-secondary/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Quick Stats (Placeholder)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold">10</p><p className="text-sm text-muted-foreground">Total Products</p></div>
            <div><p className="text-2xl font-bold">58</p><p className="text-sm text-muted-foreground">Pending Orders</p></div>
            <div><p className="text-2xl font-bold">₹56,700</p><p className="text-sm text-muted-foreground">Revenue (Month)</p></div>
            <div><p className="text-2xl font-bold">350</p><p className="text-sm text-muted-foreground">Registered Users</p></div>
        </div>
      </div>
    </div>
  );
}
