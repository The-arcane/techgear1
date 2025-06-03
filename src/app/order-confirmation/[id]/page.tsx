import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

type OrderConfirmationPageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: OrderConfirmationPageProps): Promise<Metadata> {
  return {
    title: `Order #${params.id} Confirmed | TechGear`,
    description: `Your TechGear order #${params.id} has been successfully placed.`,
  };
}

export default function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id: orderId } = params;

  // In a real app, you might fetch order details here to display a summary.
  // For this example, we'll just display a generic confirmation.

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Card className="w-full max-w-lg p-6 md:p-8 shadow-xl">
        <CardHeader className="items-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold font-headline">Order Confirmed!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Thank you for your purchase at TechGear.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            Your Order ID is: <strong className="text-primary">{orderId}</strong>
          </p>
          <p className="text-muted-foreground">
            You will receive an email confirmation shortly with your order details.
            Your order will be processed and shipped via Cash on Delivery.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/orders">
              <Button variant="outline" className="w-full sm:w-auto">View Order History</Button>
            </Link>
            <Link href="/">
              <Button className="w-full sm:w-auto">Continue Shopping</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
