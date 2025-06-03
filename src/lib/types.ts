
export interface Product {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
  price: number;
  images: string[]; // Will be populated with image_url from Supabase, or a placeholder
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
  productId: string;
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
  paymentMethod: 'COD';
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
  image_url: string; // text
  created_at: string; // timestamptz, Supabase client returns as ISO string
}

export interface SupabaseOrder {
  id: number; // int4, primary key
  user_id: string; // uuid, foreign key to auth.users.id
  status: string; // text, e.g., 'Pending', 'Shipped'
  payment_mode: string; // text, e.g., 'COD'
  total_amount: number; // numeric
  created_at: string; // timestamptz
}

export interface SupabaseOrderItem {
  id: number; // int4, primary key
  order_id: number; // int4, foreign key to orders.id
  product_id: number; // int4, foreign key to products.id
  quantity: number; // int4
  price_at_time: number; // numeric
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
