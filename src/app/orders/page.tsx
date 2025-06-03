
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import type { Order, OrderStatus, SupabaseOrderFetched } from "@/lib/types"; 
import type { Metadata } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/database.types';

export const metadata: Metadata = {
  title: 'My Orders | TechGear',
  description: 'View your order history with TechGear.',
};

export default async function OrdersPage() {
  const cookieStore = cookies();
  console.log('[OrdersPage] All cookies visible to server component:', JSON.stringify(cookieStore.getAll(), null, 2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log(`[OrdersPage] SUPABASE_URL: ${supabaseUrl}`);
  console.log(`[OrdersPage] SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Defined' : 'NOT DEFINED'}`);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[OrdersPage] Supabase URL or Anon Key is missing from environment variables on the server.");
    // This is a critical configuration error.
    // You might want to throw an error or redirect to an error page.
    // For now, logging and attempting to proceed (which will likely fail auth).
    return (
        <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h1 className="text-2xl font-semibold text-destructive">Server Configuration Error</h1>
            <p className="text-muted-foreground mt-2">The application is not configured correctly. Please contact support.</p>
        </div>
    );
  }
  
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  );

  console.log('[OrdersPage] Attempting to get user session...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  console.log('[OrdersPage] User object from supabase.auth.getUser():', JSON.stringify(user, null, 2));
  
  if (authError) {
    console.error(
      '[OrdersPage] Error getting user session. Name:', authError.name, 
      'Message:', authError.message, 
      'Status:', authError.status,
      'Full Error:', JSON.stringify(authError, null, 2)
    );
  }

  if (authError || !user) {
    console.log('[OrdersPage] Auth error or no user found, redirecting to login. AuthError:', !!authError, 'User:', !!user);
    redirect('/login?message=Please login to view your orders.');
  }
  
  console.log(`[OrdersPage] User authenticated: ${user.id}. Email: ${user.email}. Fetching orders...`);
  const { data: ordersData, error: ordersFetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (ordersFetchError) {
    console.error("[OrdersPage] Error fetching orders from Supabase:", JSON.stringify(ordersFetchError, null, 2));
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
    id: dbOrder.id.toString(),
    db_id: dbOrder.id,
    userId: dbOrder.user_id || '', 
    userEmail: dbOrder.user_email,
    items: [], 
    totalAmount: dbOrder.total_amount,
    status: dbOrder.status as OrderStatus || 'Pending',
    orderDate: dbOrder.created_at,
    shippingAddress: dbOrder.shipping_address, 
    paymentMethod: (dbOrder.payment_mode as 'COD') || 'COD',
  })) || [];

  console.log(`[OrdersPage] Successfully fetched ${orders.length} orders for user ${user.id}.`);

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
