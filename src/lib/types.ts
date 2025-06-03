
export interface Product {
  id: string; // This is kept as string because the API and mock data use it. Parsed to int for DB ops if needed.
  name: string;
  description: string;
  categorySlug: string;
  price: number;
  images: string[];
  specifications: Record<string, string>;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  description?: string;
}

export interface CartItem {
  productId: string; // String ID, matches Product.id. Will be parsed to int for order_items if DB product_id is int.
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number; // Current stock of the product, used for cart validation
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

// This Order type is for client-side representation, might differ slightly from direct DB structure
export interface Order {
  id: string; // Supabase ID will be number, but often handled as string in JS. Confirmation page uses string.
  userId: string;
  userEmail?: string;
  items: CartItem[]; // For display, might be enriched later
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD';
  // Supabase specific fields if needed directly on this type
  db_id?: number; // To store the actual numeric ID from Supabase if needed elsewhere
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Supabase table structures for type safety
export interface SupabaseProfile {
  id: string; // uuid, matches auth.users.id
  full_name?: string;
  phone_number?: string;
  address?: string;
  created_at?: string; // timestamptz
}

export interface SupabaseProduct {
  id: number; // int4, primary key
  name: string; // text
  description: string; // text
  price: number; // numeric
  category: string; // text
  stock: number; // int4
  image_url?: string | null; // text, can be null
  created_at: string; // timestamptz, Supabase client returns as ISO string
}

export interface SupabaseOrderInsert {
  user_id: string;
  user_email?: string;
  status: string;
  payment_method: string;
  total_amount: number;
  shipping_address: ShippingAddress; // Stored as JSONB
  // created_at is auto-generated
}

export interface SupabaseOrderFetched {
    id: number; // Actual DB ID
    user_id: string;
    user_email?: string;
    status: string;
    payment_method: string;
    total_amount: number;
    shipping_address: ShippingAddress;
    created_at: string;
}


export interface SupabaseOrderItemInsert {
  order_id: number;
  product_id: number; // Assuming products.id in DB is integer
  quantity: number;
  price_at_time: number;
}

export interface SupabaseAdmin {
  id: string; // uuid, PRIMARY KEY REFERENCES auth.users(id)
  full_name: string; // text NOT NULL
  email: string; // text UNIQUE NOT NULL
  can_manage_products?: boolean; // DEFAULT true
  can_manage_orders?: boolean; // DEFAULT true
  can_manage_users?: boolean; // DEFAULT true
  can_manage_categories?: boolean; // DEFAULT true
  can_manage_store_settings?: boolean; // DEFAULT true
  created_at?: string; // timestamp with time zone DEFAULT now()
}
