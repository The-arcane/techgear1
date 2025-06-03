
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { ListOrdered, ShoppingBag } from "lucide-react";
import type { Order } from "@/lib/types"; // Assuming Order type is defined
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Orders | TechGear',
  description: 'View your order history with TechGear.',
};

// Placeholder for fetching user orders - in real app this would be dynamic
const getUserOrders = async (): Promise<Order[]> => {
  // Simulate fetching orders
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { 
      id: "TG-123456", userId: "user1", 
      items: [{ productId: "logitech-mx-master-3", name: "Logitech MX Master 3 Mouse", price: 7999, quantity: 1, image: "https://placehold.co/600x400.png", stock: 10 }], 
      totalAmount: 7999, status: "Delivered", orderDate: new Date(Date.now() - 1000*60*60*24*5).toISOString(), // 5 days ago
      shippingAddress: { fullName: "John Doe", address: "123 Main St", city: "Anytown", postalCode: "12345", country: "India"},
      paymentMethod: "COD"
    },
    { 
      id: "TG-789012", userId: "user1", 
      items: [
        { productId: "apple-magic-keyboard", name: "Apple Magic Keyboard", price: 9500, quantity: 1, image: "https://placehold.co/600x400.png", stock: 10 },
        { productId: "anker-usbc-charger", name: "Anker USB-C Charger", price: 1299, quantity: 1, image: "https://placehold.co/600x400.png", stock: 10 }
      ], 
      totalAmount: 10799, status: "Shipped", orderDate: new Date(Date.now() - 1000*60*60*24*2).toISOString(), // 2 days ago
      shippingAddress: { fullName: "John Doe", address: "123 Main St", city: "Anytown", postalCode: "12345", country: "India"},
      paymentMethod: "COD"
    },
  ];
};

// Basic auth check placeholder - in real app this would come from auth context/middleware
const isAuthenticated = true; 

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

  const orders = await getUserOrders();

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
                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'Processing' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700' // Cancelled or other
                      }`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Link href={`/orders/${order.id}`}> {/* Placeholder for individual order detail page */}
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
