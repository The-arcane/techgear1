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
];

export const products: Product[] = [
  // Laptops
  {
    id: 'laptop-x1',
    name: 'UltraBook X1',
    description: 'Sleek, powerful, and lightweight ultrabook for professionals.',
    categorySlug: 'laptops',
    price: 1299.99,
    images: ['https://placehold.co/600x400.png?text=Laptop+X1+Main', 'https://placehold.co/600x400.png?text=Laptop+X1+Side'],
    specifications: { RAM: '16GB', Storage: '512GB SSD', Processor: 'Intel i7 13th Gen', Display: '14" QHD' },
    stock: 15,
  },
  {
    id: 'gaming-laptop-g7',
    name: 'GamerMax G7',
    description: 'High-performance gaming laptop with a stunning display and top-tier graphics.',
    categorySlug: 'laptops',
    price: 1899.00,
    images: ['https://placehold.co/600x400.png?text=Gaming+Laptop+Main', 'https://placehold.co/600x400.png?text=Gaming+Laptop+Keyboard'],
    specifications: { RAM: '32GB', Storage: '1TB NVMe SSD', Processor: 'AMD Ryzen 9', GPU: 'NVIDIA RTX 4070', Display: '17.3" 240Hz' },
    stock: 8,
  },
  // Keyboards
  {
    id: 'mech-keyboard-k10',
    name: 'MechKey K10 Pro',
    description: 'Mechanical keyboard with customizable RGB lighting and Cherry MX Brown switches.',
    categorySlug: 'keyboards',
    price: 159.50,
    images: ['https://placehold.co/600x400.png?text=Mech+Keyboard+Top', 'https://placehold.co/600x400.png?text=Mech+Keyboard+Angle'],
    specifications: { Type: 'Mechanical', Switches: 'Cherry MX Brown', Backlight: 'RGB', Connectivity: 'USB-C, Bluetooth' },
    stock: 30,
  },
  {
    id: 'wireless-keyboard-slim',
    name: 'SlimType Wireless',
    description: 'Ultra-slim wireless keyboard for a clean and modern desk setup.',
    categorySlug: 'keyboards',
    price: 89.99,
    images: ['https://placehold.co/600x400.png?text=Wireless+Keyboard+Main'],
    specifications: { Type: 'Chiclet', Connectivity: 'Bluetooth 5.0', Battery: 'Rechargeable, 3 months' },
    stock: 25,
  },
  // Mice
  {
    id: 'gaming-mouse-m500',
    name: 'ProGamer M500',
    description: 'Ergonomic gaming mouse with adjustable DPI and programmable buttons.',
    categorySlug: 'mice',
    price: 79.00,
    images: ['https://placehold.co/600x400.png?text=Gaming+Mouse+Top', 'https://placehold.co/600x400.png?text=Gaming+Mouse+Side'],
    specifications: { DPI: '16000', Buttons: '8 Programmable', Sensor: 'Optical', Weight: '95g' },
    stock: 40,
  },
  // Mobile Chargers
  {
    id: 'fast-charger-pd100',
    name: 'PowerDash PD100W',
    description: '100W USB-C PD fast charger for laptops, tablets, and phones.',
    categorySlug: 'mobile-chargers',
    price: 49.99,
    images: ['https://placehold.co/600x400.png?text=PD+Charger'],
    specifications: { Output: '100W Max', Ports: '1x USB-C, 1x USB-A', Technology: 'GaN' },
    stock: 50,
  },
  // Earphones
  {
    id: 'noise-cancelling-buds-q30',
    name: 'QuietBuds Q30',
    description: 'True wireless earbuds with active noise cancellation and long battery life.',
    categorySlug: 'earphones',
    price: 129.00,
    images: ['https://placehold.co/600x400.png?text=Earbuds+Case', 'https://placehold.co/600x400.png?text=Earbuds+Pair'],
    specifications: { Type: 'In-ear, True Wireless', ANC: 'Yes', Battery: '8hrs + 24hrs (case)', Connectivity: 'Bluetooth 5.2' },
    stock: 22,
  },
   {
    id: 'studio-headphones-h800',
    name: 'StudioPro H800',
    description: 'Over-ear studio monitoring headphones with exceptional clarity.',
    categorySlug: 'earphones',
    price: 249.00,
    images: ['https://placehold.co/600x400.png?text=Studio+Headphones+Main', 'https://placehold.co/600x400.png?text=Studio+Headphones+Earcup'],
    specifications: { Type: 'Over-ear, Wired', Driver: '50mm Neodymium', Impedance: '32 Ohms', FrequencyResponse: '10Hz - 40kHz' },
    stock: 12,
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
