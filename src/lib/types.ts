
export interface Product {
  id: string;
  name: string;
  description: string;
  categorySlug: string; 
  price: number;
  images: string[]; // URLs
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
  userId: string; // Assuming user context, can be anonymous for now
  userEmail?: string; // Added for admin display
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string; // ISO string
  shippingAddress: ShippingAddress;
  paymentMethod: 'COD';
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  // password will not be stored on client models
}

