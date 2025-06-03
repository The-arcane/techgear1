import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { products } from "@/lib/data";
import { Edit3, Trash2, PlusCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Products | Admin Panel | TechGear',
  description: 'View, add, edit, or delete products in the TechGear store.',
};

export default function AdminProductsPage() {
  // In a real app, this would involve role checks and fetching data
  const isAdmin = true; 

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
          <CardDescription>Showing all {products.length} products in the store.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <Image src={product.images[0]} alt={product.name} layout="fill" objectFit="cover" data-ai-hint={`${product.categorySlug} item`}/>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.categorySlug}</TableCell>
                  <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}

