
"use client"; // Make this a client component to fetch data

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { products as mockProducts } from "@/lib/data"; // Remove mock data import
import type { Product } from '@/lib/types';
import { Edit3, Trash2, PlusCircle, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// import type { Metadata } from 'next'; // Metadata needs to be handled differently

// export const metadata: Metadata = { // Static metadata is fine if defined in a parent layout or this remains a server component
//   title: 'Manage Products | Admin Panel | TechGear',
//   description: 'View, add, edit, or delete products in the TechGear store.',
// };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // In a real app, this would involve role checks
  const isAdmin = true; 

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products'); // Relative path for client-side fetch
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    if (isAdmin) {
      fetchProducts();
    } else {
      setIsLoading(false); // If not admin, don't attempt to load
    }
  }, [isAdmin]);

  if (!isAdmin) {
     return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
        <Link href="/admin"><Button>Back to Admin</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Products</h1>
        <Link href="/admin/products/new">
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            {isLoading ? "Loading products..." : 
             error ? "Error loading products" :
             `Showing all ${products.length} products in the store.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Fetching products...</p>
            </div>
          ) : error ? (
             <div className="text-center py-10 text-destructive">
              <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
              <p className="font-semibold">Failed to load products</p>
              <p className="text-sm">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                Try Again
              </Button>
            </div>
          ) : products.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
                <PackageSearch className="mx-auto h-12 w-12 mb-3" />
                <p className="text-lg">No products found.</p>
                <p className="text-sm">Try adding a new product to get started.</p>
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative w-12 h-12 rounded overflow-hidden border">
                        <Image 
                          src={product.images[0] || 'https://placehold.co/100x100.png'} 
                          alt={product.name} 
                          layout="fill" 
                          objectFit="cover" 
                          data-ai-hint={`${product.categorySlug} item`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categorySlug}</TableCell>
                    <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{product.stock}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Link href={`/products/${product.id}`} target="_blank">
                          <Button variant="outline" size="icon" title="View Product">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="outline" size="icon" title="Edit Product">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="destructive" size="icon" title="Delete Product" onClick={() => alert(`Delete product ${product.name}? (Not implemented)`)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
