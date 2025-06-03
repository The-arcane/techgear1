
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import type { SupabaseOrderFetched, Order, OrderStatus } from '@/lib/types';

async function isAdmin(supabaseClient: ReturnType<typeof createServerClient<Database>>): Promise<boolean> {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return false;

  const { data: adminData, error } = await supabaseClient
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status in API (/api/admin/orders):", error);
    return false;
  }
  return !!adminData;
}

export async function GET(request: NextRequest) {
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

  try {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*') // Selects all columns from the orders table
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching all orders for admin:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch orders.', error: error.message }, { status: 500 });
    }

    // Transform SupabaseOrderFetched to Order type if needed, or ensure frontend handles it
    // For simplicity, we'll assume the frontend can adapt or Order type is compatible
    const orders: Order[] = ordersData?.map((dbOrder: SupabaseOrderFetched) => ({
        id: dbOrder.id.toString(),
        db_id: dbOrder.id,
        userId: dbOrder.user_id || '',
        userEmail: dbOrder.user_email || 'N/A',
        items: [], // Items are not fetched in the list view for brevity
        totalAmount: dbOrder.total_amount,
        status: (dbOrder.status as OrderStatus) || 'Pending',
        orderDate: dbOrder.created_at,
        shippingAddress: dbOrder.shipping_address,
        paymentMethod: (dbOrder.payment_mode as 'COD') || 'COD',
    })) || [];


    return NextResponse.json({ success: true, orders }, { status: 200 });

  } catch (e) {
    console.error('API - Unexpected error fetching all orders for admin:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Failed to process request.', error: errorMessage }, { status: 500 });
  }
}
