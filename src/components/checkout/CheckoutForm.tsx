
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import type { ShippingAddress, SupabaseOrderInsert, SupabaseOrderItemInsert } from '@/lib/types';
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
      // Note: Your 'orders' table schema does not explicitly list 'shipping_address' or 'user_email'.
      // The code below includes them. If these columns don't exist, the insert will fail.
      // It's recommended to add `shipping_address JSONB` and `user_email TEXT` to your `orders` table.
      const orderToInsert: SupabaseOrderInsert = {
        user_id: user.id,
        user_email: user.email, // Assumes you want to store this; add column to Supabase if needed
        shipping_address: shippingAddress, // Assumes you want to store this; add column (JSONB) to Supabase if needed
        total_amount: getCartTotal(),
        status: 'Pending', 
        payment_mode: 'COD', // Matches your table's 'payment_mode'
      };

      const { data: newOrderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderToInsert)
        .select()
        .single();

      if (orderError || !newOrderData) {
        console.error('Error creating order:', orderError);
        toast({ title: "Order Placement Failed", description: orderError?.message || "Could not save order. Check if 'shipping_address' and 'user_email' columns exist in your 'orders' table.", variant: "destructive", duration: 10000 });
        setIsLoading(false);
        return;
      }

      const newOrderId = newOrderData.id;

      // 2. Create order items and update stock
      const orderItemsToInsert: SupabaseOrderItemInsert[] = [];
      let stockUpdateError = false;

      for (const item of cartItems) {
        const productIdInt = parseInt(item.productId, 10);
        if (isNaN(productIdInt)) {
            console.error(`Invalid product ID for item ${item.name}: ${item.productId}. Skipping item.`);
            stockUpdateError = true; 
            continue; 
        }

        orderItemsToInsert.push({
          order_id: newOrderId,
          product_id: productIdInt,
          quantity: item.quantity,
          price_at_time: item.price,
        });

        const { data: productData, error: productFetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productIdInt) 
          .single();

        if (productFetchError || !productData) {
          console.error(`Error fetching stock for product ${productIdInt}:`, productFetchError);
          stockUpdateError = true;
          continue; 
        }

        const currentStock = productData.stock || 0; // Default to 0 if stock is null
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          console.warn(`Product ${productIdInt} stock cannot go below 0. Clamping to 0.`);
          // This check is important. Ideally, cart addition logic also prevents this.
          // For now, clamp stock to 0 if over-sold.
          const { error: stockClampError } = await supabase
            .from('products')
            .update({ stock: 0 })
            .eq('id', productIdInt);
          if (stockClampError) {
            console.error(`Error clamping stock for product ${productIdInt}:`, stockClampError);
            stockUpdateError = true;
          }
          continue; 
        }
        
        const { error: stockUpdateDbError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productIdInt); 

        if (stockUpdateDbError) {
          console.error(`Error updating stock for product ${productIdInt}:`, stockUpdateDbError);
          stockUpdateError = true;
        }
      }

      if (orderItemsToInsert.length > 0) {
        const { error: orderItemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (orderItemsError) {
            console.error('Error creating order items:', orderItemsError);
            toast({ title: "Order Items Failed", description: orderItemsError.message, variant: "destructive" });
            // Attempt to delete the created order if items fail
            await supabase.from('orders').delete().eq('id', newOrderId);
            setIsLoading(false);
            return;
        }
      }


      if (stockUpdateError) {
        toast({ title: "Order Placed with Issues", description: `Order #${newOrderId} created, but some stock updates may have failed or items were out of stock. Please contact support.`, variant: "destructive", duration: 10000 });
      } else {
        toast({ title: "Order Placed!", description: `Your order #${newOrderId} has been successfully placed.` });
      }

      clearCart();
      setIsLoading(false);
      router.push(`/order-confirmation/${newOrderId}`); // Use the actual DB order ID
      router.refresh(); 

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
            {/* Email is tied to account, no separate input here; will be taken from auth user */}
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
