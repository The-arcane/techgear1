
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getOrderById } from '@/lib/data';
import { ArrowLeft, Package, MapPin, CreditCard, UserCircle, Hash, CalendarDays } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

type AdminOrderDetailPageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: AdminOrderDetailPageProps): Promise<Metadata> {
  const order = getOrderById(params.id);
  return {
    title: `Admin View: Order ${order ? `#${order.id}` : ''} | TechGear`,
    description: `Admin details for TechGear order ${order ? `#${order.id}` : ''}.`,
  };
}

// Basic role check placeholder
const isAdmin = true;

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id: orderId } = params;
  const order = getOrderById(orderId);

  if (!isAdmin) {
     return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
        <Link href="/admin"><Button>Back to Admin Panel</Button></Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive mb-4">Order Not Found</h1>
        <p className="text-muted-foreground">
          The order ID specified does not exist.
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
                Viewing full details for order #{order.id}
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
              <div><strong className="text-muted-foreground">Order ID:</strong> {order.id}</div>
              <div><strong className="text-muted-foreground">User ID:</strong> {order.userId}</div>
              <div><strong className="text-muted-foreground">Customer Email:</strong> {order.userEmail || 'N/A'}</div>
              <div><strong className="text-muted-foreground">Order Date:</strong> {new Date(order.orderDate).toLocaleString()}</div>
            </div>

            <Separator />
            
            <h2 className="text-xl font-semibold mb-1 flex items-center"><Package className="mr-2 h-5 w-5 text-primary"/>Items Ordered</h2>
            <ul className="space-y-3">
              {order.items.map(item => (
                <li key={item.productId} className="flex items-center space-x-4 p-3 border rounded-md bg-background hover:shadow-sm transition-shadow">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                    <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" data-ai-hint="product thumbnail" />
                  </div>
                  <div className="flex-grow">
                    <Link href={`/products/${item.productId}`} target="_blank" className="font-medium hover:text-primary transition-colors">{item.name}</Link>
                    <p className="text-xs text-muted-foreground">ID: {item.productId}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity} @ ₹{item.price.toFixed(2)}</p>
                  </div>
                  <p className="text-md font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>
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
            {/* Placeholder for actions like "Print Invoice" or "Resend Confirmation" */}
            <Button variant="secondary" onClick={() => alert("Mock action: Print Invoice")}>Print Invoice</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper to get Tailwind CSS class for order status (optional, can be done inline)
function getStatusClass(status: string): string {
  switch (status) {
    case 'Delivered': return 'bg-green-100 text-green-700';
    case 'Shipped': return 'bg-blue-100 text-blue-700';
    case 'Processing': return 'bg-purple-100 text-purple-700';
    case 'Pending': return 'bg-yellow-100 text-yellow-700';
    case 'Cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
