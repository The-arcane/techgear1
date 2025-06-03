
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { Order } from "@/lib/types"; 
import type { Metadata } from 'next';
import { getUserOrders as fetchUserOrders } from "@/lib/data"; // Renamed for clarity

export const metadata: Metadata = {
  title: 'My Orders | TechGear',
  description: 'View your order history with TechGear.',
};

// Basic auth check placeholder - in real app this would come from auth context/middleware
const isAuthenticated = true; 
const currentUserId = "user1"; // Placeholder for logged-in user ID

export default async function OrdersPage() {

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground">You need to be logged in to view your orders.</p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  const orders = await fetchUserOrders(currentUserId); // Fetch orders for current user

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
                    <TableCell className="font-medium">{order.id}</TableCell>
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

