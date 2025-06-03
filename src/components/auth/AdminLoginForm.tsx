
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const [email, setEmail] = useState('raunaq.adlakha@gmail.com'); // Pre-fill for convenience
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.user && result.user.role === 'admin' && result.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', result.token);
          localStorage.setItem('authUser', JSON.stringify(result.user));
        }
        toast({ title: "Admin Login Successful", description: "Redirecting to admin panel..." });
        router.push('/admin');
        router.refresh(); // To re-trigger header auth check
      } else if (response.ok && result.success && result.user && result.user.role !== 'admin') {
        toast({ title: "Login Failed", description: "Not an admin account.", variant: "destructive" });
      }
      else {
        const errorMsg = result.message || "Admin login failed. Please check your credentials.";
        toast({ title: "Admin Login Failed", description: errorMsg, variant: "destructive" });
      }
    } catch (error) {
      console.error("Admin login form error:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
