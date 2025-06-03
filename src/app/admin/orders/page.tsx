
"use client"; 

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllOrders as fetchAllOrders, updateOrderStatus as mockUpdateStatus, getOrderById as fetchOrderById } from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";
import { Eye, Edit, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import type { Metadata } from 'next';

// Metadata can't be dynamic in client components directly this way
// export const metadata: Metadata = { 
//   title: 'Manage Orders | Admin Panel | TechGear',
//   description: 'View and manage customer orders in the TechGear store.',
// };

// Basic role check placeholder
const isAdmin = true; 

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    const loadOrders = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      const fetchedOrders = fetchAllOrders();
      setOrders(fetchedOrders);
      setIsLoading(false);
    };
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 700));
    const success = mockUpdateStatus(orderId, newStatus); // Use mock update function

    if (success) {
      // Re-fetch or update local state
      const updatedOrder = fetchOrderById(orderId);
      if (updatedOrder) {
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
      }
      toast({ title: "Status Updated", description: `Order ${orderId} status changed to ${newStatus}.` });
    } else {
      toast({ title: "Update Failed", description: `Could not update status for order ${orderId}.`, variant: "destructive" });
    }
    setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
  };

  if (!isAdmin) {
     return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
        <Link href="/admin"><Button>Back to Admin Panel</Button></Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2"/>Loading orders...</div>;
  }
  
  const orderStatuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Orders</h1>
        {/* Placeholder for "Add New Order" if needed, usually orders come from customers */}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>Showing all {orders.length} customer orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">No orders found.</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.userEmail || order.shippingAddress.fullName}</TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                        disabled={updatingStatus[order.id]}
                      >
                        <SelectTrigger className="w-[130px] h-9">
                          <SelectValue placeholder="Set status" />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map(status => (
                            <SelectItem key={status} value={status}>
                               <span className={`flex items-center ${
                                status === 'Delivered' ? 'text-green-600' :
                                status === 'Shipped' ? 'text-blue-600' :
                                status === 'Processing' ? 'text-purple-600' :
                                status === 'Pending' ? 'text-yellow-600' :
                                status === 'Cancelled' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {status === 'Delivered' && <CheckCircle className="mr-2 h-4 w-4" />}
                                {status === 'Cancelled' && <XCircle className="mr-2 h-4 w-4" />}
                                {status}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="icon" title="View Order Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {/* <Button variant="outline" size="icon" title="Edit Order (Placeholder)" disabled>
                          <Edit className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
