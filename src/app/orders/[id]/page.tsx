
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardSubTitle } from '@/components/ui/card'; // CardSubTitle might not exist, adjust if needed
import { Separator } from '@/components/ui/separator';
import { getOrderById } from '@/lib/data';
import type { Order } from '@/lib/types';
import { ArrowLeft, Package, MapPin, CreditCard, ShoppingCart, Hash } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

type UserOrderDetailPageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: UserOrderDetailPageProps): Promise<Metadata> {
  const order = getOrderById(params.id);
  return {
    title: `Order Details ${order ? `#${order.id}` : ''} | TechGear`,
    description: `View details for your TechGear order ${order ? `#${order.id}` : ''}.`,
  };
}

// This is a placeholder for authentication. In a real app, you'd verify
// that the logged-in user owns this order or is an admin.
const canViewOrder = (order: Order | undefined, currentUserId: string = "user1") => {
    // For now, any authenticated user can see any order for demo.
    // Replace "user1" with actual logged-in user ID logic.
    return !!order; // && (order.userId === currentUserId || isAdmin);
};


export default function UserOrderDetailPage({ params }: UserOrderDetailPageProps) {
  const { id: orderId } = params;
  const order = getOrderById(orderId);

  if (!order || !canViewOrder(order)) {
    return (
      <div className="text-center py-12">
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
              <CardTitle className="text-3xl font-headline">Order #{order.id}</CardTitle>
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
            <ul className="space-y-4">
              {order.items.map(item => (
                <li key={item.productId} className="flex items-start space-x-4 p-4 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                    <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" data-ai-hint="product" />
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
                 {/* Add more payment details if available, like transaction ID for non-COD */}
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
