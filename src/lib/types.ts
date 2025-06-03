
export interface Product {
  id: string; // Kept as string due to mock data and API. Parsed to int for DB.
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
  productId: string; // String ID, matches Product.id. Will be parsed to int for order_items.
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string; 
  userId: string;
  userEmail?: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD'; // This type is used by mock data, can be payment_mode if needed there too
  db_id?: number; 
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Supabase table structures based on provided schema
export interface SupabaseProfile {
  id: string; // uuid
  full_name?: string | null; // text
  phone_number?: string | null; // text
  address?: string | null; // text
  created_at?: string; // timestamptz
}

export interface SupabaseProduct {
  id: number; // integer, primary key
  name: string; // text
  description?: string | null; // text
  price: number; // numeric
  category?: string | null; // text
  stock?: number | null; // integer, default 0
  image_url?: string | null; // text
  created_at?: string; // timestamptz
}

export interface SupabaseOrderInsert {
  user_id?: string | null; // uuid
  // user_email: string; // This column is NOT in your provided `orders` schema. Retained for now, will error if column missing.
  status?: string; // text, default 'pending'
  payment_mode?: string; // text, default 'COD'
  total_amount: number; // numeric
  // shipping_address: ShippingAddress; // This column is NOT in your provided `orders` schema. Retained as JSONB assumption, will error if column missing.
  // The following are columns that I expect should be in your `orders` table
  // for a typical e-commerce app, especially with COD.
  // If they are not, the insert will fail, highlighting the schema mismatch.
  user_email?: string; // Assuming you'll add this for record keeping
  shipping_address?: ShippingAddress; // Assuming you'll add this (as JSONB) for shipping
}

export interface SupabaseOrderFetched {
    id: number; // integer
    user_id?: string | null; // uuid
    user_email?: string | null; // text - Assuming you might add this to your table
    status?: string | null; // text
    payment_mode?: string | null; // text
    total_amount: number; // numeric
    shipping_address?: ShippingAddress; // JSONB - Assuming you might add this
    created_at?: string; // timestamptz
}


export interface SupabaseOrderItemInsert {
  order_id?: number | null; // integer
  product_id?: number | null; // integer
  quantity: number; // integer
  price_at_time: number; // numeric
}

export interface SupabaseAdmin {
  id: string; // uuid
  full_name: string; // text
  email: string; // text
  can_manage_products?: boolean | null; // boolean, default true
  can_manage_orders?: boolean | null; // boolean, default true
  can_manage_users?: boolean | null; // boolean, default true
  can_manage_categories?: boolean | null; // boolean, default true
  can_manage_store_settings?: boolean | null; // boolean, default true
  created_at?: string; // timestamptz, default now()
}
