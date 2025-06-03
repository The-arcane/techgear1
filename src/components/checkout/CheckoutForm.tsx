
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

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Supabase auth.getUser error:', JSON.stringify(authError, null, 2));
      toast({ title: "Authentication Error", description: `Could not retrieve user session: ${authError.message}. Please try logging in again.`, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const user = authData.user;
    console.log('User object from Supabase auth.getUser():', JSON.stringify(user, null, 2));

    if (!user || !user.id) {
      console.warn('Checkout attempt: User not found or user.id is missing. User object:', JSON.stringify(user, null, 2));
      toast({ title: "Authentication Error", description: "You must be logged in to place an order, or user ID is missing.", variant: "destructive" });
      setIsLoading(false);
      router.push('/login');
      return;
    }

    console.log('Attempting to place order for user ID (auth.users.id / profiles.id):', user.id, 'User email:', user.email);

    try {
      const orderToInsert: SupabaseOrderInsert = {
        user_id: user.id, // This ID should exist in profiles table if trigger is set up
        user_email: user.email || '', // Uses default from your schema if user.email is null/undefined
        shipping_address: shippingAddress, // Uses default from your schema if this results in {}
        total_amount: getCartTotal(),
        status: 'Pending', // Default is 'pending' in schema
        payment_mode: 'COD', // Default is 'COD' in schema
      };
      
      console.log('Order object being inserted:', JSON.stringify(orderToInsert, null, 2));

      const { data: newOrderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderToInsert)
        .select()
        .single();

      if (orderError || !newOrderData) {
        console.error('Error creating order. orderError object:', JSON.stringify(orderError, null, 2), 'newOrderData:', newOrderData);
        toast({ title: "Order Placement Failed", description: `Error: ${orderError?.message || "Could not save order."} Ensure a profile exists for the user and all required fields are correct.`, variant: "destructive", duration: 10000 });
        setIsLoading(false);
        return;
      }

      const newOrderId = newOrderData.id;
      console.log('Order created successfully with ID:', newOrderId);

      const orderItemsToInsert: SupabaseOrderItemInsert[] = [];
      let stockUpdateErrorOccurred = false;

      for (const item of cartItems) {
        const productIdInt = parseInt(item.productId, 10);
        if (isNaN(productIdInt)) {
            console.error(`Invalid product ID for item ${item.name}: ${item.productId}. Skipping item.`);
            stockUpdateErrorOccurred = true;
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
          console.error(`Error fetching stock for product ID ${productIdInt}:`, JSON.stringify(productFetchError, null, 2));
          stockUpdateErrorOccurred = true;
          continue;
        }

        const currentStock = productData.stock || 0;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          console.warn(`Product ID ${productIdInt} stock (${currentStock}) is less than quantity ordered (${item.quantity}). Clamping stock to 0.`);
          const { error: stockClampError } = await supabase
            .from('products')
            .update({ stock: 0 })
            .eq('id', productIdInt);
          if (stockClampError) {
            console.error(`Error clamping stock for product ID ${productIdInt}:`, JSON.stringify(stockClampError, null, 2));
            stockUpdateErrorOccurred = true;
          }
          continue; 
        }
        
        const { error: stockUpdateDbError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', productIdInt);

        if (stockUpdateDbError) {
          console.error(`Error updating stock for product ID ${productIdInt}:`, JSON.stringify(stockUpdateDbError, null, 2));
          stockUpdateErrorOccurred = true;
        }
      }

      if (orderItemsToInsert.length > 0) {
        const { error: orderItemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);

        if (orderItemsError) {
            console.error('Error creating order items:', JSON.stringify(orderItemsError, null, 2));
            toast({ title: "Order Items Failed", description: (orderItemsError as any)?.message || "Could not save order items.", variant: "destructive" });
            await supabase.from('orders').delete().eq('id', newOrderId); // Attempt rollback
            setIsLoading(false);
            return;
        }
      } else if (cartItems.length > 0) { 
          console.error('No valid order items could be prepared. Rolling back order.');
          toast({ title: "Order Failed", description: "No items could be processed for the order.", variant: "destructive" });
          await supabase.from('orders').delete().eq('id', newOrderId); // Attempt rollback
          setIsLoading(false);
          return;
      }


      if (stockUpdateErrorOccurred) {
        toast({ title: "Order Placed with Issues", description: `Order #${newOrderId} created, but some stock updates or item processing may have failed. Please check admin panel or contact support.`, variant: "default", duration: 10000 });
      } else {
        toast({ title: "Order Placed!", description: `Your order #${newOrderId} has been successfully placed.` });
      }

      clearCart();
      setIsLoading(false);
      router.push(`/order-confirmation/${newOrderId}`);
      router.refresh();

    } catch (error) {
      console.error('Checkout process error:', error instanceof Error ? error.message : JSON.stringify(error));
      toast({ title: "Checkout Error", description: error instanceof Error ? error.message : "An unexpected error occurred during checkout.", variant: "destructive" });
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


    