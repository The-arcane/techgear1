
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
  id: string; // App-level ID, string representation of DB integer ID
  userId: string; // Supabase auth.users.id (UUID)
  userEmail: string; // User's email
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string; // ISO string
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD'; // Corresponds to payment_mode in DB
  db_id?: number; // Actual integer ID from DB orders table
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
  user_id?: string | null; // uuid (references profiles.id which is auth.users.id)
  status?: string; // text, default 'pending'
  payment_mode?: string; // text, default 'COD'
  total_amount: number; // numeric
  user_email: string; // text NOT NULL
  shipping_address: ShippingAddress; // jsonb NOT NULL
}

export interface SupabaseOrderFetched {
    id: number; // integer (Primary Key from DB)
    user_id: string | null; // uuid (references profiles.id)
    status: string | null; // text
    payment_mode: string | null; // text
    total_amount: number; // numeric
    created_at: string; // timestamptz
    shipping_address: ShippingAddress; // jsonb
    user_email: string; // text
}


export interface SupabaseOrderItemInsert {
  order_id: number; // integer (references orders.id)
  product_id: number; // integer (references products.id)
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

export interface SupabaseOrderItemWithProduct extends SupabaseOrderItemInsert {
  products: {
    id: number;
    name: string;
    image_url: string | null;
    stock: number | null;
    // category: string | null; // if needed for categorySlug
  } | null; // Product could be null if deleted
}
