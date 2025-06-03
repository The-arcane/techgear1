
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import type { OrderStatus } from '@/lib/types';

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as [OrderStatus, ...OrderStatus[]]),
});

async function isAdmin(supabaseClient: ReturnType<typeof createServerClient<Database>>): Promise<boolean> {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return false;

  const { data: adminData, error } = await supabaseClient
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status in API (/api/admin/orders/[id]/status):", error);
    return false;
  }
  return !!adminData;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const isUserAdmin = await isAdmin(supabase);
  if (!isUserAdmin) {
    return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const { id } = params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    return NextResponse.json({ success: false, message: 'Invalid Order ID.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = UpdateOrderStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status } = validation.data;

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status: status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error updating order status for ${orderId}:`, error);
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ success: false, message: `Order with ID ${orderId} not found.` }, { status: 404 });
      }
      if (error.message.includes('violates row-level security policy')) {
          return NextResponse.json({ success: false, message: 'Failed to update order status. Ensure RLS policies allow this.', error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: false, message: 'Failed to update order status in database.', error: error.message }, { status: 500 });
    }

    if (!updatedOrder) {
        return NextResponse.json({ success: false, message: `Order with ID ${orderId} not found or no changes made.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Order status updated successfully!', order: updatedOrder }, { status: 200 });

  } catch (e) {
    console.error(`API - Unexpected error updating order status for ${orderId}:`, e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to process request.', error: errorMessage }, { status: 500 });
  }
}
