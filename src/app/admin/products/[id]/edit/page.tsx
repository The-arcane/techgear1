
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories as mockCategories } from "@/lib/data"; 
import type { Product } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';

interface EditProductPageProps {
  params: { id: string };
}

interface EditProductFormState {
  name: string;
  description: string;
  categorySlug: string;
  price: string;
  stock: string;
  imageUrl1: string;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id: productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<EditProductFormState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchProductDetails = async () => {
      setIsFetchingProduct(true);
      try {
        // Fetch the product from your API /api/products/[id]
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product details');
        }
        const data = await response.json();
        const fetchedProduct: Product = data.product;

        if (fetchedProduct) {
          setProduct(fetchedProduct);
          setFormData({
            name: fetchedProduct.name,
            description: fetchedProduct.description,
            categorySlug: fetchedProduct.categorySlug,
            price: fetchedProduct.price.toString(),
            stock: fetchedProduct.stock.toString(),
            imageUrl1: fetchedProduct.images[0] || '',
          });
        } else {
          toast({ title: "Error", description: "Product not found.", variant: "destructive" });
          router.push('/admin/products');
        }
      } catch (error) {
        console.error("Error fetching product for edit:", error);
        toast({ title: "Error", description: "Could not load product data.", variant: "destructive" });
        router.push('/admin/products');
      } finally {
        setIsFetchingProduct(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId, toast, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (formData) {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSelectChange = (value: string) => {
    if (formData) {
      setFormData({ ...formData, categorySlug: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: "Success", description: result.message || "Product updated successfully!" });
        router.push('/admin/products');
        router.refresh(); 
      } else {
        const errorMsg = result.errors ? Object.values(result.errors).flat().join(', ') : result.message;
        toast({ title: "Error Updating Product", description: errorMsg || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Network or unexpected error:", error);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading product details...</p>
      </div>
    );
  }
  
  if (!product || !formData) {
    // This case should be handled by the redirect in useEffect, but as a fallback
    return <div className="text-center py-10">Product data could not be loaded.</div>;
  }
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Edit Product: {product.name}</h1>
         <Link href="/admin/products">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Products</Button>
        </Link>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Update the details for this product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categorySlug">Category</Label>
                <Select name="categorySlug" value={formData.categorySlug} onValueChange={handleSelectChange} required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map(cat => (
                      <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required disabled={isLoading} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" name="price" type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]+" value={formData.price} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input id="stock" name="stock" type="number" inputMode="numeric" pattern="[0-9]*" value={formData.stock} onChange={handleChange} required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl1">Main Image URL</Label>
              <Input id="imageUrl1" name="imageUrl1" placeholder="https://placehold.co/600x400.png" value={formData.imageUrl1} onChange={handleChange} disabled={isLoading} type="url" />
               <p className="text-xs text-muted-foreground">Leave blank to use a default placeholder if desired by API, or provide a valid URL.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Link href="/admin/products">
              <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </Link>
            <Button type="submit" disabled={isLoading || isFetchingProduct}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
