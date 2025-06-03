
import type { Category, Product, Order, OrderStatus, CartItem, ShippingAddress } from './types';

export const categories: Category[] = [
  {
    id: 'keyboards',
    name: 'Keyboards',
    slug: 'keyboards',
    imageUrl: 'https://i.postimg.cc/1z7JdR3d/magic-keyboard-with-touch-id-and-numeric-keypad-for-mac-models-with-apple-silicon-white-keys-MXK73.jpg',
    description: 'Mechanical, wireless, and ergonomic keyboards.',
  },
  {
    id: 'mice',
    name: 'Mice',
    slug: 'mice',
    imageUrl: 'https://i.postimg.cc/YSHXFDyX/Logitech-MX-Master-3-S-1200x1200.jpg',
    description: 'Precision gaming mice and comfortable office mice.',
  },
  {
    id: 'mobile-chargers',
    name: 'Mobile Chargers',
    slug: 'mobile-chargers',
    imageUrl: 'https://i.postimg.cc/9MVFv2gG/61-R3k6-I3uv-L-AC-UF1000-1000-QL80-Dp-Weblab.jpg',
    description: 'Fast chargers, power banks, and wireless chargers.',
  },
  {
    id: 'earphones',
    name: 'Earphones',
    slug: 'earphones',
    imageUrl: 'https://i.postimg.cc/8zt21SCR/Galaxy-Buds-Pro-PR-main1.jpg',
    description: 'In-ear, over-ear, wireless, and noise-cancelling earphones.',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    slug: 'accessories',
    imageUrl: 'https://i.postimg.cc/3JWSgvrv/dell-gen-snp-carrying-cases-laptop-sleeve-pe21vx-800x620.avif',
    description: 'Essential accessories like sleeves, cables, and more.',
  },
];

export let products: Product[] = [
  {
    id: '1',
    name: 'Logitech MX Master 3 Mouse',
    description: 'Ergonomic wireless mouse with ultrafast scrolling and customizable buttons for productivity.',
    categorySlug: 'mice',
    price: 7999,
    images: ['https://i.postimg.cc/YSHXFDyX/Logitech-MX-Master-3-S-1200x1200.jpg'],
    specifications: { Sensor: "Darkfield 4000 DPI", Connectivity: "Bluetooth, Unifying Receiver", Buttons: "7" },
    stock: 25,
  },
  {
    id: '2',
    name: 'Apple Magic Keyboard',
    description: 'Sleek and comfortable wireless keyboard with a stable scissor mechanism.',
    categorySlug: 'keyboards',
    price: 9500,
    images: ['https://i.postimg.cc/1z7JdR3d/magic-keyboard-with-touch-id-and-numeric-keypad-for-mac-models-with-apple-silicon-white-keys-MXK73.jpg'],
    specifications: { Layout: "Compact", Connectivity: "Bluetooth", KeyType: "Scissor mechanism" },
    stock: 15,
  },
  {
    id: '3',
    name: 'Anker USB-C Charger',
    description: 'Compact and powerful USB-C fast charger for phones, tablets, and laptops.',
    categorySlug: 'mobile-chargers',
    price: 1299,
    images: ['https://i.postimg.cc/9MVFv2gG/61-R3k6-I3uv-L-AC-UF1000-1000-QL80-Dp-Weblab.jpg'],
    specifications: { Wattage: "65W", Ports: "1 USB-C", Technology: "GaN II" },
    stock: 40,
  },
  {
    id: '4',
    name: 'Samsung Galaxy Buds Pro',
    description: 'True wireless earbuds with intelligent Active Noise Cancellation and immersive sound.',
    categorySlug: 'earphones',
    price: 11499,
    images: ['https://i.postimg.cc/8zt21SCR/Galaxy-Buds-Pro-PR-main1.jpg'],
    specifications: { Type: "In-ear", ANC: "Intelligent ANC", Playtime: "5 hours (buds)" },
    stock: 30,
  },
  {
    id: '5',
    name: 'Razer BlackWidow Keyboard',
    description: 'Iconic mechanical gaming keyboard known for its precision and tactile feedback.',
    categorySlug: 'keyboards',
    price: 8499,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Switches: "Razer Green Mechanical", Backlight: "Razer Chroma RGB", Durability: "80 million keystrokes" },
    stock: 20,
  },
  {
    id: '6',
    name: 'Dell Inspiron Laptop Sleeve',
    description: 'Protective and stylish sleeve for Dell Inspiron laptops up to 15 inches.',
    categorySlug: 'accessories',
    price: 1199,
    images: ['https://i.postimg.cc/3JWSgvrv/dell-gen-snp-carrying-cases-laptop-sleeve-pe21vx-800x620.avif'],
    specifications: { Material: "Neoprene", Size: "Fits up to 15-inch laptops", Closure: "Zipper" },
    stock: 50,
  },
  {
    id: '7',
    name: 'Jabra Elite 75t Earphones',
    description: 'Compact true wireless earbuds with great sound, secure fit, and long battery life.',
    categorySlug: 'earphones',
    price: 7999,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Type: "In-ear", Battery: "7.5 hours (buds)", IPRating: "IP55" },
    stock: 28,
  },
  {
    id: '8',
    name: 'Amazon Basics HDMI Cable',
    description: 'High-speed HDMI cable for connecting your devices to displays, supporting 4K video.',
    categorySlug: 'accessories',
    price: 799,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Length: "6 Feet", Standard: "HDMI 2.0", Resolution: "4K @ 60Hz" },
    stock: 60,
  },
  {
    id: '9',
    name: 'Sony Wireless Mouse',
    description: 'Reliable and compact wireless mouse, perfect for everyday use and travel.',
    categorySlug: 'mice',
    price: 1499,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Connectivity: "2.4GHz Wireless", BatteryLife: "Up to 12 months", Buttons: "3" },
    stock: 35,
  },
  {
    id: '10',
    name: 'Belkin Fast Charging Cable',
    description: 'Durable USB-C to Lightning cable for fast charging Apple devices.',
    categorySlug: 'mobile-chargers',
    price: 899,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Type: "USB-C to Lightning", Length: "1 meter", Certification: "MFi Certified" },
    stock: 45,
  }
];

// Mock shipping address for sample orders
const mockShippingAddress: ShippingAddress = {
  fullName: "Mock User",
  address: "123 Mock Street",
  city: "Mockville",
  postalCode: "00000",
  country: "Mockland"
};

// Mock orders for admin panel overview
export let orders: Order[] = [
  {
    id: 'order101',
    userId: 'mock-user-1',
    userEmail: 'user1@example.com',
    items: [
      { productId: '1', name: 'Logitech MX Master 3 Mouse', price: 7999, quantity: 1, image: products[0].images[0], stock: products[0].stock },
    ],
    totalAmount: 7999,
    status: 'Delivered',
    orderDate: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    shippingAddress: mockShippingAddress,
    paymentMethod: 'COD',
  },
  {
    id: 'order102',
    userId: 'mock-user-2',
    userEmail: 'user2@example.com',
    items: [
      { productId: '3', name: 'Anker USB-C Charger', price: 1299, quantity: 2, image: products[2].images[0], stock: products[2].stock },
      { productId: '4', name: 'Samsung Galaxy Buds Pro', price: 11499, quantity: 1, image: products[3].images[0], stock: products[3].stock },
    ],
    totalAmount: (1299*2) + 11499,
    status: 'Pending',
    orderDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    shippingAddress: mockShippingAddress,
    paymentMethod: 'COD',
  },
  {
    id: 'order103',
    userId: 'mock-user-1',
    userEmail: 'user1@example.com',
    items: [
      { productId: '2', name: 'Apple Magic Keyboard', price: 9500, quantity: 1, image: products[1].images[0], stock: products[1].stock },
    ],
    totalAmount: 9500,
    status: 'Shipped',
    orderDate: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    shippingAddress: mockShippingAddress,
    paymentMethod: 'COD',
  },
];


export const getProductsByCategory = (categorySlug: string): Product[] => {
  return products.filter(product => product.categorySlug === categorySlug);
};

export const getProductById = (productId: string): Product | undefined => {
  return products.find(product => product.id === productId);
};

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find(category => category.slug === slug);
};

// Reinstated mock function for admin panel
export const getAllOrders = (): Order[] => {
  return orders;
};

export const getOrderById = (orderId: string): Order | undefined => {
  return orders.find(order => order.id === orderId);
};

export const updateOrderStatus = (orderId: string, status: OrderStatus): boolean => {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].status = status;
    return true;
  }
  return false;
};


export const updateMockProductStock = (productId: string, quantitySold: number): boolean => {
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    const newStock = products[productIndex].stock - quantitySold;
    if (newStock < 0) {
      console.warn(`Mock: Product ${productId} stock cannot go below 0. Setting to 0.`);
      products[productIndex].stock = 0;
    } else {
      products[productIndex].stock = newStock;
    }
    console.log(`Mock: Product ${productId} stock updated to ${products[productIndex].stock}. Sold: ${quantitySold}`);
    return true;
  }
  console.warn(`Mock: Product ${productId} not found for stock update.`);
  return false;
};

// Placeholder for adding an order if needed by admin mocks, not tied to Supabase
export const addOrder = (newOrder: Order): void => {
  orders.unshift(newOrder); // Add to the beginning of the array
};
