
"use client"; 

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product } from '@/lib/types';
import { Edit3, Trash2, PlusCircle, ExternalLink, Loader2, AlertTriangle, PackageSearch } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation';


export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const isAdmin = true; 

  async function fetchProducts() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products'); 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch products: ${response.statusText}`);
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

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    } else {
      setIsLoading(false); 
    }
  }, [isAdmin]);

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsLoading(true); // Use general loading state for simplicity or a specific one
    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Success", description: result.message || "Product deleted successfully!" });
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
      } else {
         toast({ title: "Error Deleting Product", description: result.message || "Could not delete product.", variant: "destructive", duration: 7000 });
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      toast({ title: "Network Error", description: "Could not connect to server to delete product.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setProductToDelete(null); 
    }
  };


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
            {isLoading && !error ? "Loading products..." : 
             error ? "Error loading products" :
             `Showing all ${products.length} products in the store.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !error ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Fetching products...</p>
            </div>
          ) : error ? (
             <div className="text-center py-10 text-destructive">
              <AlertTriangle className="mx-auto h-10 w-10 mb-2" />
              <p className="font-semibold">Failed to load products</p>
              <p className="text-sm">{error}</p>
              <Button onClick={fetchProducts} className="mt-4" variant="outline">
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
                  <TableHead className="text-center w-[180px]">Actions</TableHead>
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
                    <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>{product.name}</TableCell>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="Delete Product" onClick={() => setProductToDelete(product)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          {productToDelete && productToDelete.id === product.id && (
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the product
                                  "{productToDelete.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteProduct}
                                  className="bg-destructive hover:bg-destructive/90"
                                  disabled={isLoading}
                                >
                                  {isLoading && productToDelete?.id === product.id ? "Deleting..." : "Yes, delete product"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
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
