
export interface Product {
  id: string; // Assuming Supabase product id is string, adjust if it's number
  name: string;
  description: string;
  categorySlug: string; // Will be derived from 'category'
  price: number;
  images: string[]; // Will primarily use image_url from Supabase
  specifications: Record<string, string>; // Will be empty for now
  stock: number;
  // Supabase specific fields if needed directly by frontend, otherwise mapped in API
  // category: string; 
  // image_url: string;
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
  id: string; // Assuming Supabase order id is string, adjust if it's number
  userId: string; // Supabase user ID (uuid)
  userEmail?: string; 
  items: CartItem[]; // This will be populated by joining order_items or separate fetch
  totalAmount: number;
  status: OrderStatus; // Maps to Supabase 'status' string
  orderDate: string; // ISO string for 'created_at'
  shippingAddress: ShippingAddress; // This might be stored denormalized or fetched from profiles
  paymentMethod: 'COD'; // Maps to Supabase 'payment_mode'
}

export interface User {
  id: string; // Supabase auth user ID (uuid)
  email: string;
  name?: string; // from profiles table 'full_name'
  // role: 'user' | 'admin'; // Role will be determined by existence in 'admins' table
}

// Define Supabase table structures for type safety if needed directly
// This is more robustly handled by generating types from your Supabase schema (see database.types.ts)
export interface SupabaseProfile {
  id: string; // uuid
  full_name?: string;
  phone_number?: string;
  address?: string;
  created_at?: string;
}

export interface SupabaseProduct {
  id: number; // integer
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
  created_at: string;
}

export interface SupabaseOrder {
  id: number; // integer
  user_id: string; // uuid
  status: string;
  payment_mode: string;
  total_amount: number;
  created_at: string;
}

export interface SupabaseOrderItem {
  id: number; // integer
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_time: number;
}

export interface SupabaseAdmin {
  id: string; // uuid, references auth.users(id)
  full_name: string;
  email: string;
  can_manage_products?: boolean;
  can_manage_orders?: boolean;
  can_manage_users?: boolean;
  can_manage_categories?: boolean;
  can_manage_store_settings?: boolean;
  created_at?: string;
}
