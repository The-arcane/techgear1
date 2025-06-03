
import type { Category, Product } from './types';

export const categories: Category[] = [
  {
    id: 'laptops',
    name: 'Laptops',
    slug: 'laptops',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'Powerful and portable laptops for work and play.',
  },
  {
    id: 'keyboards',
    name: 'Keyboards',
    slug: 'keyboards',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'Mechanical, wireless, and ergonomic keyboards.',
  },
  {
    id: 'mice',
    name: 'Mice',
    slug: 'mice',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'Precision gaming mice and comfortable office mice.',
  },
  {
    id: 'mobile-chargers',
    name: 'Mobile Chargers',
    slug: 'mobile-chargers',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'Fast chargers, power banks, and wireless chargers.',
  },
  {
    id: 'earphones',
    name: 'Earphones',
    slug: 'earphones',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'In-ear, over-ear, wireless, and noise-cancelling earphones.',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    slug: 'accessories',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'Essential accessories like sleeves, cables, and more.',
  },
];

export const products: Product[] = [
  {
    id: 'logitech-mx-master-3',
    name: 'Logitech MX Master 3 Mouse',
    description: 'Ergonomic wireless mouse with ultrafast scrolling and customizable buttons for productivity.',
    categorySlug: 'mice',
    price: 7999,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Sensor: "Darkfield 4000 DPI", Connectivity: "Bluetooth, Unifying Receiver", Buttons: "7" },
    stock: 25,
  },
  {
    id: 'apple-magic-keyboard',
    name: 'Apple Magic Keyboard',
    description: 'Sleek and comfortable wireless keyboard with a stable scissor mechanism.',
    categorySlug: 'keyboards',
    price: 9500,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Layout: "Compact", Connectivity: "Bluetooth", KeyType: "Scissor mechanism" },
    stock: 15,
  },
  {
    id: 'anker-usbc-charger',
    name: 'Anker USB-C Charger',
    description: 'Compact and powerful USB-C fast charger for phones, tablets, and laptops.',
    categorySlug: 'mobile-chargers',
    price: 1299,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Wattage: "65W", Ports: "1 USB-C", Technology: "GaN II" },
    stock: 40,
  },
  {
    id: 'samsung-galaxy-buds-pro',
    name: 'Samsung Galaxy Buds Pro',
    description: 'True wireless earbuds with intelligent Active Noise Cancellation and immersive sound.',
    categorySlug: 'earphones',
    price: 11499,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Type: "In-ear", ANC: "Intelligent ANC", Playtime: "5 hours (buds)" },
    stock: 30,
  },
  {
    id: 'razer-blackwidow-keyboard',
    name: 'Razer BlackWidow Keyboard',
    description: 'Iconic mechanical gaming keyboard known for its precision and tactile feedback.',
    categorySlug: 'keyboards',
    price: 8499,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Switches: "Razer Green Mechanical", Backlight: "Razer Chroma RGB", Durability: "80 million keystrokes" },
    stock: 20,
  },
  {
    id: 'dell-laptop-sleeve',
    name: 'Dell Inspiron Laptop Sleeve',
    description: 'Protective and stylish sleeve for Dell Inspiron laptops up to 15 inches.',
    categorySlug: 'accessories',
    price: 1199,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Material: "Neoprene", Size: "Fits up to 15-inch laptops", Closure: "Zipper" },
    stock: 50,
  },
  {
    id: 'jabra-elite-75t',
    name: 'Jabra Elite 75t Earphones',
    description: 'Compact true wireless earbuds with great sound, secure fit, and long battery life.',
    categorySlug: 'earphones',
    price: 7999,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Type: "In-ear", Battery: "7.5 hours (buds)", IPRating: "IP55" },
    stock: 28,
  },
  {
    id: 'amazon-hdmi-cable',
    name: 'Amazon Basics HDMI Cable',
    description: 'High-speed HDMI cable for connecting your devices to displays, supporting 4K video.',
    categorySlug: 'accessories',
    price: 799,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Length: "6 Feet", Standard: "HDMI 2.0", Resolution: "4K @ 60Hz" },
    stock: 60,
  },
  {
    id: 'sony-wireless-mouse',
    name: 'Sony Wireless Mouse',
    description: 'Reliable and compact wireless mouse, perfect for everyday use and travel.',
    categorySlug: 'mice',
    price: 1499,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Connectivity: "2.4GHz Wireless", BatteryLife: "Up to 12 months", Buttons: "3" },
    stock: 35,
  },
  {
    id: 'belkin-fast-charging-cable',
    name: 'Belkin Fast Charging Cable',
    description: 'Durable USB-C to Lightning cable for fast charging Apple devices.',
    categorySlug: 'mobile-chargers',
    price: 899,
    images: ['https://placehold.co/600x400.png'],
    specifications: { Type: "USB-C to Lightning", Length: "1 meter", Certification: "MFi Certified" },
    stock: 45,
  }
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
