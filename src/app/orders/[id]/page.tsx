
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Order, OrderStatus, CartItem, SupabaseOrderFetched, SupabaseOrderItemWithProduct, ShippingAddress } from '@/lib/types';
import { ArrowLeft, Package, MapPin, CreditCard, ShoppingCart, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type UserOrderDetailPageProps = {
  params: { id: string }; // The order ID from the URL, which is the DB integer ID as string
};

async function getOrderDetailsFromSupabase(orderIdNum: number, userId: string): Promise<Order | null> {
  const supabase = createServerComponentClient({ cookies });

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select<string, SupabaseOrderFetched>(`
      id,
      user_id,
      status,
      payment_mode,
      total_amount,
      created_at,
      shipping_address,
      user_email
    `)
    .eq('id', orderIdNum)
    .eq('user_id', userId) // Ensure the user owns this order
    .single();

  if (orderError || !orderData) {
    console.error(`Error fetching order ${orderIdNum} for user ${userId}:`, orderError);
    return null;
  }

  const { data: orderItemsData, error: itemsError } = await supabase
    .from('order_items')
    .select<string, SupabaseOrderItemWithProduct>(`
      quantity,
      price_at_time,
      products (id, name, image_url, stock)
    `)
    .eq('order_id', orderData.id);

  if (itemsError) {
    console.error(`Error fetching items for order ${orderData.id}:`, itemsError);
    // Decide if order should be returned with empty items or null
    return null; 
  }

  const items: CartItem[] = orderItemsData?.map(item => ({
    productId: item.products?.id?.toString() || 'unknown-product',
    name: item.products?.name || 'Product Not Available',
    price: item.price_at_time,
    quantity: item.quantity,
    image: item.products?.image_url || 'https://placehold.co/100x100.png',
    stock: item.products?.stock || 0,
  })) || [];

  return {
    id: orderData.id.toString(),
    db_id: orderData.id,
    userId: orderData.user_id || '',
    userEmail: orderData.user_email,
    items,
    totalAmount: orderData.total_amount,
    status: orderData.status as OrderStatus || 'Pending',
    orderDate: orderData.created_at,
    shippingAddress: orderData.shipping_address as ShippingAddress, 
    paymentMethod: (orderData.payment_mode as 'COD') || 'COD',
  };
}


export async function generateMetadata({ params }: UserOrderDetailPageProps): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  let orderTitleId: string | null = null;
  if (user) {
    const orderIdNum = parseInt(params.id, 10);
    if (!isNaN(orderIdNum)) {
       const { data: orderData } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderIdNum)
        .eq('user_id', user.id)
        .single();
      if (orderData) {
        orderTitleId = orderData.id.toString();
      }
    }
  }
  
  return {
    title: `Order Details ${orderTitleId ? `#${orderTitleId}` : ''} | TechGear`,
    description: `View details for your TechGear order ${orderTitleId ? `#${orderTitleId}` : ''}.`,
  };
}


export default async function UserOrderDetailPage({ params }: UserOrderDetailPageProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please login to view your order details.');
  }

  const orderIdNum = parseInt(params.id, 10);

  if (isNaN(orderIdNum)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-4">Invalid Order ID</h1>
        <p className="text-muted-foreground">The order ID provided is not valid.</p>
        <Link href="/orders" className="mt-6 inline-block">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  const order = await getOrderDetailsFromSupabase(orderIdNum, user.id);

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-4">Order Not Found</h1>
        <p className="text-muted-foreground">
          Sorry, we couldn't find the order you're looking for, or you don't have permission to view it.
        </p>
        <Link href="/orders" className="mt-6 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Orders
          </Button>
        </Link>
      </div>
    );
  }

  const { shippingAddress } = order;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link href="/orders">
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Orders
        </Button>
      </Link>

      <Card className="shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-3xl font-headline">Order #{order.db_id}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Placed on: {new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </div>
            <div className={`px-3 py-1.5 text-sm font-semibold rounded-full text-white ${
              order.status === 'Delivered' ? 'bg-green-500' :
              order.status === 'Shipped' ? 'bg-blue-500' :
              order.status === 'Processing' ? 'bg-purple-500' :
              order.status === 'Pending' ? 'bg-yellow-500 text-yellow-900' :
              order.status === 'Cancelled' ? 'bg-red-500' :
              'bg-gray-500'
            }`}>
              {order.status}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center"><ShoppingCart className="mr-2 h-5 w-5 text-primary"/>Order Items</h2>
            {order.items.length > 0 ? (
              <ul className="space-y-4">
                {order.items.map(item => (
                  <li key={item.productId} className="flex items-start space-x-4 p-4 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                      <Image 
                        src={item.image || 'https://placehold.co/100x100.png'} 
                        alt={item.name} 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint="product item"
                      />
                    </div>
                    <div className="flex-grow">
                      <Link href={`/products/${item.productId}`} className="font-medium hover:text-primary transition-colors">{item.name}</Link>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      <p className="text-sm text-muted-foreground">Price: ₹{item.price.toFixed(2)}</p>
                    </div>
                    <p className="text-md font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No items found for this order.</p>
            )}
          </section>

          <Separator />

          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/>Shipping Address</h2>
              <div className="text-muted-foreground space-y-1 p-4 border rounded-md bg-background">
                <p><strong>{shippingAddress.fullName}</strong></p>
                <p>{shippingAddress.address}</p>
                <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
                <p>{shippingAddress.country}</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Information</h2>
              <div className="text-muted-foreground space-y-1 p-4 border rounded-md bg-background">
                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                <p><strong>Order Total:</strong> <span className="font-bold text-lg text-foreground">₹{order.totalAmount.toFixed(2)}</span></p>
              </div>
            </section>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-muted/30 flex justify-end">
            <Link href="/">
                <Button>Continue Shopping</Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
