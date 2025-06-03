
"use client"; 

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Order, OrderStatus } from "@/lib/types";
import { Eye, CheckCircle, XCircle, Loader2, AlertTriangle, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation'; // Added for potential future use

// Basic role check placeholder - can be removed if API handles auth fully
// const isAdmin = true; 

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const router = useRouter(); // For potential programmatic navigation

  async function fetchOrders() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch orders: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        throw new Error(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setOrders([]); // Clear orders on error
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setOrders(prevOrders => 
          prevOrders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        toast({ title: "Status Updated", description: `Order ${orderId} status changed to ${newStatus}.` });
      } else {
        toast({ title: "Update Failed", description: result.message || `Could not update status for order ${orderId}.`, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network Error", description: "Could not connect to the server to update status.", variant: "destructive" });
      console.error("Error updating order status:", err);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // This direct client-side isAdmin check is less secure and typically handled by API protection & page effects
  // For now, we rely on API to enforce admin access.
  // if (!isAdmin) {
  //    return (
  //     <div className="text-center py-12">
  //       <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
  //       <Link href="/admin"><Button>Back to Admin Panel</Button></Link>
  //     </div>
  //   );
  // }
  
  const orderStatuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Orders</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>
             {isLoading && !error ? "Loading orders..." : 
             error ? "Error loading orders" :
             `Showing all ${orders.length} customer orders.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !error ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Fetching orders...</p>
            </div>
          ) : error ? (
             <div className="text-center py-10 text-destructive">
              <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
              <p className="font-semibold">Failed to load orders</p>
              <p className="text-sm">{error}</p>
              <Button onClick={fetchOrders} className="mt-4" variant="outline">
                Try Again
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                <PackageSearch className="mx-auto h-12 w-12 mb-3" />
                <p className="text-lg">No orders found.</p>
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.db_id || order.id}</TableCell>
                    <TableCell>{order.userEmail}</TableCell>
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
                          <Button variant="outline" size="sm" title="View Order Details">
                            <Eye className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
