
"use client"; // This will be a client component due to form interactions

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/lib/data"; // Mock categories for dropdown
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// In a real app, this would be more comprehensive
interface NewProductFormState {
  name: string;
  description: string;
  categorySlug: string;
  price: string; // string for input, convert to number on submit
  stock: string; // string for input
  imageUrl1: string;
  // add more fields for specifications, other images etc.
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
    console.log("Submitting new product:", formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Placeholder for server action to add product
    // const result = await addProductAction(formData);
    const result = { success: true, message: "Product added successfully (mock)" }; // Mock result

    if (result.success) {
      toast({ title: "Success", description: result.message });
      router.push('/admin/products'); // Redirect to product list
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold font-headline">Add New Product</h1>
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
                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl1">Main Image URL</Label>
              <Input id="imageUrl1" name="imageUrl1" placeholder="https://placehold.co/600x400.png" value={formData.imageUrl1} onChange={handleChange} required disabled={isLoading} />
            </div>
            {/* Add more fields for specifications, other images etc. */}
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
