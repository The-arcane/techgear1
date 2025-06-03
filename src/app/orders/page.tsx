
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import type { Order, OrderStatus, SupabaseOrderFetched } from "@/lib/types"; 
import type { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'My Orders | TechGear',
  description: 'View your order history with TechGear.',
};

export default async function OrdersPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Auth error or no user found in OrdersPage:', authError);
    // It's better to redirect to login if user is not found.
    // The UI below handles !user, but redirect is cleaner for RSC.
    redirect('/login?message=Please login to view your orders.');
  }
  
  // This section will only run if user is available from the redirect above.
  // For safety, we can add an explicit check again here.
  if (!user) {
     return ( // Fallback, should ideally be caught by redirect
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
        <p className="text-muted-foreground">You need to be logged in to view your orders.</p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  const { data: ordersData, error: ordersFetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (ordersFetchError) {
    console.error("Error fetching orders from Supabase:", ordersFetchError);
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Error Loading Orders</h1>
        <p className="text-muted-foreground mt-2">Could not fetch your order history. Please try again later.</p>
        <p className="text-xs text-muted-foreground mt-1">Details: {ordersFetchError.message}</p>
      </div>
    );
  }
  
  const orders: Order[] = ordersData?.map((dbOrder: SupabaseOrderFetched) => ({
    id: dbOrder.id.toString(), // Use DB id as string for app Order type
    db_id: dbOrder.id,
    userId: dbOrder.user_id || '', // Should always be present if fetched with eq('user_id', user.id)
    userEmail: dbOrder.user_email,
    items: [], // For the list view, we don't need full item details here.
    totalAmount: dbOrder.total_amount,
    status: dbOrder.status as OrderStatus || 'Pending',
    orderDate: dbOrder.created_at,
    shippingAddress: dbOrder.shipping_address, // Assuming this is compatible
    paymentMethod: (dbOrder.payment_mode as 'COD') || 'COD', // Assuming only COD for now
  })) || [];


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">My Orders</h1>
      
      {orders.length === 0 ? (
        <Card className="text-center">
          <CardHeader>
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No Orders Yet</CardTitle>
            <CardDescription>You haven't placed any orders with us. Start shopping to see your orders here!</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Start Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>Here's a list of your past orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.db_id}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Processing' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Link href={`/orders/${order.id}`}> 
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
