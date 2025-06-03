
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
  const [email, setEmail] = useState('raunaq.admin@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[AdminLoginForm] Supabase client instance:', supabase, "Preview Environment");
    console.log('[AdminLoginForm] Attempting login for:', email, "Preview Environment");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (authError) {
      setIsLoading(false);
      console.error('[AdminLoginForm] Auth Error:', authError, "Preview Environment");
      toast({ title: "Admin Login Failed", description: authError.message, variant: "destructive" });
      return;
    }

    if (authData.user && authData.session) {
      console.log('[AdminLoginForm] signInWithPassword successful. User ID from authData.user.id:', authData.user.id, "Preview Environment");
      
      // Immediately check session persistence
      const { data: { user: immediateUser }, error: immediateError } = await supabase.auth.getUser();
      if (immediateError) {
        console.error('[AdminLoginForm] Immediate getUser after signIn FAILED:', immediateError, "Preview Environment");
      } else if (immediateUser) {
        console.log('[AdminLoginForm] Immediate getUser after signIn SUCCESS. User ID:', immediateUser.id, "Preview Environment");
      } else {
        console.warn('[AdminLoginForm] Immediate getUser after signIn returned NO USER. Session likely not persisted in Preview Environment.');
      }
      
      // Instead of checking admin status here, we'll let AdminPage handle it.
      // This might help with iframe-specific issues where subsequent queries fail immediately after login.
      toast({ title: "Login Attempt Successful", description: "Redirecting to admin panel for verification..." });
      router.push('/admin');
      router.refresh(); // Important to update server-side session state if applicable
      // setIsLoading(false); // Let the navigation handle the loading state change
      return; // Exit early

    } else {
      // This case should ideally not be hit if authError is null but no user/session
      setIsLoading(false);
      console.error("[AdminLoginForm] signInWithPassword returned no user/session despite no error. Preview Environment", authData);
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
