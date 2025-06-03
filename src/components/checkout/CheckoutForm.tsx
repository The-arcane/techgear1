
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import type { ShippingAddress, SupabaseOrderInsert, SupabaseOrderItemInsert, SupabaseProduct } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function CheckoutForm() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast({ title: "Error", description: "Your cart is empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to place an order.", variant: "destructive" });
        setIsLoading(false);
        router.push('/login');
        return;
    }

    try {
      // 1. Create the order
      const orderToInsert: SupabaseOrderInsert = {
        user_id: user.id,
        user_email: user.email,
        shipping_address: shippingAddress,
        total_amount: getCartTotal(),
        status: 'Pending', // Or 'Processing'
        payment_method: 'COD',
      };

      const { data: newOrderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderToInsert)
        .select()
        .single();

      if (orderError || !newOrderData) {
        console.error('Error creating order:', orderError);
        toast({ title: "Order Placement Failed", description: orderError?.message || "Could not save order.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const newOrderId = newOrderData.id;

      // 2. Create order items and update stock
      const orderItemsToInsert: SupabaseOrderItemInsert[] = [];
      let stockUpdateError = false;

      for (const item of cartItems) {
        // Assuming product.id in Supabase is an integer. If it's text, parseInt is not needed.
        // For safety, we should fetch the product's integer ID from Supabase if cart stores string IDs from mock data.
        // However, if product API (/api/products) already returns string IDs that are *meant* to be numbers,
        // then parseInt might be okay, but can lead to issues if an ID isn't purely numeric.
        // Let's assume `item.productId` is a string representation of an integer for now.
        const productIdInt = parseInt(item.productId, 10);
        if (isNaN(productIdInt)) {
            console.error(`Invalid product ID for item ${item.name}: ${item.productId}. Skipping item.`);
            // Potentially roll back or handle this more gracefully
            stockUpdateError = true; // Mark that an error occurred
            continue; // Skip this item
        }

        orderItemsToInsert.push({
          order_id: newOrderId,
          product_id: productIdInt,
          quantity: item.quantity,
          price_at_time: item.price,
        });

        // Update stock (this is not atomic and prone to race conditions without transactions/RPC)
        // A more robust way: use an RPC function in Supabase `decrement_stock(product_id, quantity)`
        const { data: productData, error: productFetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productIdInt) // Use integer ID for query
          .single();

        if (productFetchError || !productData) {
          console.error(`Error fetching stock for product ${productIdInt}:`, productFetchError);
          stockUpdateError = true;
          // Decide how to handle: roll back order, notify admin, etc.
          // For now, we'll just log and potentially fail the whole process later or partially succeed.
          continue; 
        }

        const currentStock = productData.stock;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          console.warn(`Product ${productIdInt} stock cannot go below 0. Order quantity exceeds stock.`);
          // This is a critical issue. Order should ideally not have been allowed if stock check failed earlier.
          // Or, the entire order creation should be rolled back here.
          stockUpdateError = true; // Mark error
          // Potentially, stop processing further stock updates or the entire order.
          // For now, we might proceed with other items but flag error for overall failure.
          continue;
        }
        
        const { error: stockUpdateDbError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productIdInt); // Use integer ID for update

        if (stockUpdateDbError) {
          console.error(`Error updating stock for product ${productIdInt}:`, stockUpdateDbError);
          stockUpdateError = true;
          // Handle error: roll back, notify etc.
        }
      }

      if (orderItemsToInsert.length > 0) {
        const { error: orderItemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (orderItemsError) {
            console.error('Error creating order items:', orderItemsError);
            // IMPORTANT: Rollback order creation here if possible, or mark order as failed.
            // This is complex without transactions managed client-side.
            // An Edge Function for order creation is better for atomicity.
            toast({ title: "Order Items Failed", description: orderItemsError.message, variant: "destructive" });
            // Attempt to delete the created order if items fail
             await supabase.from('orders').delete().eq('id', newOrderId);
            setIsLoading(false);
            return;
        }
      }


      if (stockUpdateError) {
        // If any stock update failed, it's a partial success/failure.
        // What to do? For now, inform user but order might be in DB.
        // Ideally, transactions or server-side logic handle atomicity.
        toast({ title: "Order Placed with Issues", description: `Order #${newOrderId} created, but some stock updates may have failed. Please contact support.`, variant: "destructive", duration: 7000 });
      } else {
        toast({ title: "Order Placed!", description: `Your order #${newOrderId} has been successfully placed.` });
      }

      clearCart();
      setIsLoading(false);
      router.push(`/order-confirmation/${newOrderId}`);
      router.refresh(); // Attempt to refresh server components data

    } catch (error) {
      console.error('Checkout process error:', error);
      toast({ title: "Checkout Error", description: error instanceof Error ? error.message : "An unexpected error occurred.", variant: "destructive" });
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0 && !isLoading) {
    return (
        <div className="text-center py-10">
            <p className="text-muted-foreground">Your cart is empty. Please add items before proceeding to checkout.</p>
            <Button onClick={() => router.push('/')} className="mt-4">Go Shopping</Button>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Shipping Details</CardTitle>
          <CardDescription>Enter your address for Cash on Delivery.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" required value={shippingAddress.fullName} onChange={handleInputChange} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              {/* Email is tied to account, no separate input here */}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input id="address" name="address" required value={shippingAddress.address} onChange={handleInputChange} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required value={shippingAddress.city} onChange={handleInputChange} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" name="postalCode" required value={shippingAddress.postalCode} onChange={handleInputChange} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" required value={shippingAddress.country} onChange={handleInputChange} disabled={isLoading} />
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2">Payment Method</h3>
            <p className="text-muted-foreground">Cash on Delivery (COD) will be used for this order.</p>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
           <div className="text-xl font-semibold flex justify-between w-full">
              <span>Order Total:</span>
              <span>₹{getCartTotal().toFixed(2)}</span>
            </div>
          <Button type="submit" size="lg" className="w-full" disabled={isLoading || cartItems.length === 0}>
            {isLoading ? 'Placing Order...' : 'Place Order (COD)'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
