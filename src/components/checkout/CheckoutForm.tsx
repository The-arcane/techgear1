
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import type { ShippingAddress, Order, CartItem } from '@/lib/types';
import { useRouter } from 'next/navigation'; // For redirection
import { addOrder as saveMockOrder, updateProductStock as updateMockProductStock } from '@/lib/data'; // Import mock data functions
import { supabase } from '@/lib/supabaseClient'; // For getting current user

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
    country: 'India', // Default country
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

    // Get current user for order
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to place an order.", variant: "destructive" });
        setIsLoading(false);
        router.push('/login');
        return;
    }

    // Simulate order placement
    console.log("Placing order with:", { shippingAddress, cartItems, total: getCartTotal(), userId: user.id });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call delay

    const orderId = `TG-${Date.now().toString().slice(-6)}`; // Mock order ID

    const newOrder: Order = {
      id: orderId,
      userId: user.id, // Use actual user ID
      userEmail: user.email,
      items: cartItems.map(item => ({ ...item })), // Ensure deep copy of items
      totalAmount: getCartTotal(),
      status: 'Processing', // Initial status
      orderDate: new Date().toISOString(),
      shippingAddress: { ...shippingAddress }, // Ensure deep copy
      paymentMethod: 'COD',
    };

    // "Save" order to mock data
    saveMockOrder(newOrder);

    // "Update" stock in mock data
    for (const item of cartItems) {
      updateMockProductStock(item.productId, item.quantity);
    }

    toast({ title: "Order Placed!", description: `Your order #${orderId} has been successfully placed.` });
    clearCart(); // This will also trigger a toast "Cart cleared", which is fine for now or can be made conditional
    setIsLoading(false);
    router.push(`/order-confirmation/${orderId}`);
    router.refresh(); // Refresh server components to reflect new order in history
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
              {/* Placeholder for email if needed, usually tied to account */}
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
