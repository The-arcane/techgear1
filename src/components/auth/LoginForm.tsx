
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation'; // Import useRouter

// import { loginUser } from "@/lib/actions/auth.actions"; // Placeholder for server action

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Admin credentials check
    if (email === 'raunaq.adlakha@gmail.com' && password === 'Rahu45$') {
      toast({ title: "Admin Login Successful", description: "Redirecting to admin panel..." });
      // In a real app, you would set some auth state here
      // For now, we'll simulate this by setting a flag in localStorage
      // and then expect Header to pick it up or manage state via context.
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdmin', 'true'); 
      }
      router.push('/admin');
      setIsLoading(false);
      return;
    }

    // Placeholder for general user login
    // const result = await loginUser({ email, password }); 
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    const result = { success: false, message: "Login functionality is not yet implemented. This is a placeholder." };


    if (result.success) {
      toast({ title: "Login Successful", description: "Welcome back!" });
      // Redirect user, e.g., router.push('/');
    } else {
      toast({ title: "Login Failed", description: result.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Login to TechGear</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
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
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
