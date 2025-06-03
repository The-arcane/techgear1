
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/lib/data"; 
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';

interface NewProductFormState {
  name: string;
  description: string;
  categorySlug: string;
  price: string; 
  stock: string; 
  imageUrl1: string;
}

export default function NewProductPage() {
  const [formData, setFormData] = useState<NewProductFormState>({
    name: '',
    description: '',
    categorySlug: '',
    price: '',
    stock: '',
    imageUrl1: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, categorySlug: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: "Success", description: result.message || "Product added successfully!" });
        router.push('/admin/products'); 
        router.refresh(); // To ensure the product list is updated on the products page
      } else {
        console.error("Add product error details:", result.errors || result.message);
        const errorMsg = result.errors ? Object.values(result.errors).flat().join(', ') : result.message;
        toast({ title: "Error Adding Product", description: errorMsg || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Network or unexpected error:", error);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Add New Product</h1>
        <Link href="/admin/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Fill in the details for the new product.</CardDescription>
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
                    {categories.map(cat => (
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Product"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
