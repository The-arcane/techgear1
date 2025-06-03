
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Store Settings | Admin Panel | TechGear',
  description: 'Configure store settings for TechGear.',
};

export default function AdminSettingsPage() {
  // Basic role check placeholder
  const isAdmin = true;

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
        <Link href="/admin"><Button>Back to Admin Panel</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <Settings className="mr-3 h-8 w-8 text-primary"/> Store Settings
        </h1>
        <Link href="/admin">
          <Button variant="outline">Back to Admin Panel</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>This section is under development.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground text-lg">Store settings features are coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
