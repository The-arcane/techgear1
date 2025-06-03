
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

export interface Order {
  id: string;
  userId: string; // Assuming user context, can be anonymous for now
  items: CartItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
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
