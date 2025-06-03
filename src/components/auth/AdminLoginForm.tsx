
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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (authError) {
      setIsLoading(false);
      toast({ title: "Admin Login Failed", description: authError.message, variant: "destructive" });
      return;
    }

    if (authData.user && authData.session) {
      // Check if the user is in the 'admins' table
      const { data: adminData, error: adminCheckError } = await supabase
        .from('admins')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle(); // Use maybeSingle to not error if user not found in admins

      setIsLoading(false);

      if (adminCheckError) {
        console.error("Error checking admin table:", adminCheckError.message);
        await supabase.auth.signOut(); // Sign out as a precaution
        toast({ title: "Login Error", description: "Could not verify admin status. Please try again.", variant: "destructive" });
        return;
      }

      if (adminData) { // If adminData is not null, user is an admin
        toast({ title: "Admin Login Successful", description: "Redirecting to admin panel..." });
        router.push('/admin');
        router.refresh(); // Important to update layout/auth state for other parts of app
      } else {
        await supabase.auth.signOut(); // Sign out non-admin users immediately
        toast({ title: "Login Failed", description: "Not an authorized admin account.", variant: "destructive" });
      }
    } else {
      setIsLoading(false);
      // This case should ideally not be reached if authError is handled
      toast({ title: "Admin Login Failed", description: "Invalid email or password, or unexpected issue.", variant: "destructive" });
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
              placeholder="Enter admin password"
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
