
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, MapPin, CreditCard, UserCircle, Hash, CalendarDays, ShoppingCart, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from '@/lib/database.types';
import type { Order, OrderStatus, CartItem, SupabaseOrderFetched, SupabaseOrderItemWithProduct, ShippingAddress } from '@/lib/types';
import { PrintInvoiceButton } from '@/components/admin/PrintInvoiceButton';

type AdminOrderDetailPageProps = {
  params: { id: string };
};


async function getAdminOrderDetailsFromSupabase(orderIdNum: number, supabaseClient: ReturnType<typeof createServerClient<Database>>): Promise<Order | null> {
  console.log(`[getAdminOrderDetailsFromSupabase] Fetching order ID: ${orderIdNum}`);

  // Check admin status before fetching order
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    console.warn("[getAdminOrderDetailsFromSupabase] No authenticated user for admin check.");
    return null; // Or redirect if this page is directly accessed without auth
  }
  const { data: adminData, error: adminCheckError } = await supabaseClient
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (adminCheckError || !adminData) {
    console.warn(`[getAdminOrderDetailsFromSupabase] User ${user.id} is not an admin or error checking:`, adminCheckError);
    return null; // Not an admin
  }
  console.log(`[getAdminOrderDetailsFromSupabase] User ${user.id} confirmed as admin. Proceeding to fetch order.`);


  const { data: orderData, error: orderError } = await supabaseClient
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
    .single();

  if (orderError || !orderData) {
    console.error(`[getAdminOrderDetailsFromSupabase] Error fetching order ${orderIdNum}:`, JSON.stringify(orderError, null, 2));
    return null;
  }
  console.log(`[getAdminOrderDetailsFromSupabase] Fetched order data for order ID ${orderIdNum}:`, JSON.stringify(orderData, null, 2));

  const { data: orderItemsData, error: itemsError } = await supabaseClient
    .from('order_items')
    .select<string, SupabaseOrderItemWithProduct>(`
      quantity,
      price_at_time,
      products (id, name, image_url, stock)
    `)
    .eq('order_id', orderData.id);

  if (itemsError) {
    console.error(`[getAdminOrderDetailsFromSupabase] Error fetching items for order ${orderData.id}:`, JSON.stringify(itemsError, null, 2));
    return null; 
  }
  console.log(`[getAdminOrderDetailsFromSupabase] Fetched items for order ID ${orderData.id}:`, JSON.stringify(orderItemsData, null, 2));

  const items: CartItem[] = orderItemsData?.map(item => ({
    productId: item.products?.id?.toString() || 'unknown-product',
    name: item.products?.name || 'Product Not Available',
    price: item.price_at_time,
    quantity: item.quantity,
    image: item.products?.image_url || 'https://placehold.co/100x100.png',
    stock: item.products?.stock || 0, // stock info might be useful for admin
  })) || [];

  return {
    id: orderData.id.toString(),
    db_id: orderData.id,
    userId: orderData.user_id || '',
    userEmail: orderData.user_email || 'N/A',
    items,
    totalAmount: orderData.total_amount,
    status: orderData.status as OrderStatus || 'Pending',
    orderDate: orderData.created_at,
    shippingAddress: orderData.shipping_address as ShippingAddress, 
    paymentMethod: (orderData.payment_mode as 'COD') || 'COD',
  };
}


export async function generateMetadata({ params }: AdminOrderDetailPageProps): Promise<Metadata> {
  // Minimal metadata, actual order ID determined in component
  return {
    title: `Admin View: Order #${params.id} | TechGear`,
    description: `Admin details for TechGear order #${params.id}.`,
  };
}


export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const cookieStore = cookies(); 
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, { 
    cookies: { get: (name) => cookieStore.get(name)?.value } 
  });

  // This check is implicitly handled by getAdminOrderDetailsFromSupabase,
  // but good for an early redirect if needed.
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    redirect('/admin/login?message=Please login to view admin order details.');
  }
  const { data: adminCheck } = await supabase.from('admins').select('id').eq('id', authUser.id).maybeSingle();
  if (!adminCheck) {
    // Not an admin, or error during check. Redirect or show access denied.
    // For simplicity, we can let the getAdminOrderDetailsFromSupabase handle returning null,
    // which will result in "Order Not Found" or an access denied message.
    // Or redirect more explicitly:
    console.warn(`[AdminOrderDetailPage] User ${authUser.id} is not an admin. Redirecting.`);
     return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Link href="/admin" className="mt-6 inline-block"><Button>Back to Admin Panel</Button></Link>
      </div>
    );
  }


  const orderIdNum = parseInt(params.id, 10);

  if (isNaN(orderIdNum)) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-4">Invalid Order ID</h1>
        <p className="text-muted-foreground">The order ID provided is not valid.</p>
        <Link href="/admin/orders" className="mt-6 inline-block">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders List</Button>
        </Link>
      </div>
    );
  }
  
  const order = await getAdminOrderDetailsFromSupabase(orderIdNum, supabase);

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-4">Order Not Found</h1>
        <p className="text-muted-foreground">
          The order ID specified does not exist or you do not have permission to view it.
        </p>
        <Link href="/admin/orders" className="mt-6 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders List
          </Button>
        </Link>
      </div>
    );
  }

  const { shippingAddress } = order;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link href="/admin/orders">
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders List
        </Button>
      </Link>

      <Card className="shadow-xl">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center">
                <Package className="mr-3 h-8 w-8 text-primary"/> Order Details
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground ml-11">
                Viewing full details for order #{order.db_id || order.id}
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

        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <section className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold mb-1 flex items-center"><UserCircle className="mr-2 h-5 w-5 text-primary"/>Customer & Order Info</h2>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-background text-sm">
              <div><strong className="text-muted-foreground">Order ID:</strong> #{order.db_id || order.id}</div>
              <div><strong className="text-muted-foreground">User ID:</strong> {order.userId || "N/A"}</div>
              <div><strong className="text-muted-foreground">Customer Email:</strong> {order.userEmail || 'N/A'}</div>
              <div><strong className="text-muted-foreground">Order Date:</strong> {new Date(order.orderDate).toLocaleString()}</div>
            </div>

            <Separator />
            
            <h2 className="text-xl font-semibold mb-1 flex items-center"><ShoppingCart className="mr-2 h-5 w-5 text-primary"/>Items Ordered</h2>
             {order.items.length > 0 ? (
                <ul className="space-y-3">
                {order.items.map(item => (
                    <li key={item.productId} className="flex items-center space-x-4 p-3 border rounded-md bg-background hover:shadow-sm transition-shadow">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                        <Image 
                        src={item.image || 'https://placehold.co/100x100.png'} 
                        alt={item.name} 
                        layout="fill" 
                        objectFit="cover" 
                        data-ai-hint="product thumbnail" 
                        />
                    </div>
                    <div className="flex-grow">
                        <Link href={`/products/${item.productId}`} target="_blank" className="font-medium hover:text-primary transition-colors">{item.name}</Link>
                        <p className="text-xs text-muted-foreground">Product ID: {item.productId}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity} @ ₹{item.price.toFixed(2)}</p>
                    </div>
                    <p className="text-md font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-muted-foreground">No items found for this order.</p>
            )}
          </section>

          <aside className="md:col-span-1 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary"/>Shipping Address</h2>
              <div className="text-sm text-muted-foreground space-y-1 p-4 border rounded-md bg-background">
                <p><strong>{shippingAddress.fullName}</strong></p>
                <p>{shippingAddress.address}</p>
                <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
                <p>{shippingAddress.country}</p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Summary</h2>
              <div className="text-sm text-muted-foreground space-y-2 p-4 border rounded-md bg-background">
                <p className="flex justify-between"><strong>Payment Method:</strong> <span>{order.paymentMethod}</span></p>
                <Separator className="my-1"/>
                <p className="flex justify-between text-lg"><strong>Order Total:</strong> <span className="font-bold text-foreground">₹{order.totalAmount.toFixed(2)}</span></p>
              </div>
            </section>
          </aside>
        </CardContent>
        <CardFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            {/* Potential actions for admin: Print Invoice, Resend Confirmation, Trigger Refund etc. */}
            <PrintInvoiceButton />
        </CardFooter>
      </Card>
    </div>
  );
}
