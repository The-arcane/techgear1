
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function AdminLoginForm() {
  const [email, setEmail] = useState('raunaq.adlakha@gmail.com'); // Pre-fill for convenience
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    setIsLoading(false);

    if (error) {
      toast({ title: "Admin Login Failed", description: error.message, variant: "destructive" });
    } else if (data.user && data.session) {
      // Check for admin role. This is a placeholder.
      // In a real Supabase app, roles can be managed via custom claims or a separate 'roles' table.
      // For custom claims, you might check: data.user.app_metadata?.claims_admin === true
      // Or, you might have a 'role' field in user_metadata, e.g. data.user.user_metadata?.role === 'admin'
      // For this example, we'll check a mock 'role' in user_metadata or if email matches your admin email.
      const isAdmin = data.user.email === 'raunaq.adlakha@gmail.com' || data.user.user_metadata?.role === 'admin';

      if (isAdmin) {
        toast({ title: "Admin Login Successful", description: "Redirecting to admin panel..." });
        // Supabase client handles session persistence.
        router.push('/admin');
        router.refresh();
      } else {
        await supabase.auth.signOut(); // Sign out non-admin users immediately
        toast({ title: "Login Failed", description: "Not an authorized admin account.", variant: "destructive" });
      }
    } else {
       toast({ title: "Admin Login Failed", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Admin Panel Login</CardTitle>
        <CardDescription>Enter your administrator credentials.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Rahu45$"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login as Admin'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Not an admin?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              User Login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
