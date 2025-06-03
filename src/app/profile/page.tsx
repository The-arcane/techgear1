
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UserCircle, Mail, Phone, MapPin, Edit3, Save, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import type { SupabaseProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Use client-side Supabase instance
import type { User as AuthUser } from '@supabase/supabase-js';

interface ProfileFormData {
  full_name: string;
  phone_number: string;
  address: string;
}

export default function ProfilePage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({ full_name: '', phone_number: '', address: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Page-level loading state for auth and initial profile fetch
  const [isSaving, setIsSaving] = useState(false); // For save button loading state
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchProfileData = async (currentUser: AuthUser) => {
    // This function handles fetching the profile data itself.
    // The page-level isLoading is for the overall auth check + initial profile load.
    // We can set it true here to indicate profile fetching, and false in finally.
    setIsLoading(true); 
    setError(null);
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single<SupabaseProfile>();

      if (profileError && profileError.code !== 'PGRST116') { 
        throw profileError;
      }
      
      setProfile(data);
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          address: data.address || '',
        });
      } else {
         console.warn(`[ProfilePage] Profile not found for user ID: ${currentUser.id}.`);
         setError("Your profile data could not be loaded. It might not have been created yet.");
      }
    } catch (err: any) {
      console.error("[ProfilePage] Error fetching profile:", err);
      setError(err.message || "Could not fetch your profile data.");
      setProfile(null);
    } finally {
      setIsLoading(false); // Done fetching profile or failed
    }
  };

  useEffect(() => {
    setIsLoading(true); // Start in loading state when component mounts/router changes
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[ProfilePage] onAuthStateChange event:", event, "Session:", !!session);
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser); 

      if (currentUser) {
        fetchProfileData(currentUser); // Fetches profile and sets isLoading false in its finally
      } else {
        // No user, not loading anymore for auth, redirect.
        // If fetchProfileData was ongoing, its finally block will also set isLoading false.
        setIsLoading(false); 
        router.push('/login?message=Please login to view your profile.&source=profilepage_authchange_nouser');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Only re-run if router changes


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing && profile) { 
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success && result.profile) {
        toast({ title: "Success", description: "Profile updated successfully!" });
        setProfile(result.profile); 
         setFormData({ 
          full_name: result.profile.full_name || '',
          phone_number: result.profile.phone_number || '',
          address: result.profile.address || '',
        });
        setIsEditing(false);
      } else {
        const errorMsg = result.errors ? Object.values(result.errors).flat().join(', ') : result.message;
        toast({ title: "Error Updating Profile", description: errorMsg || "An unknown error occurred.", variant: "destructive" });
      }
    } catch (err) {
      console.error("[ProfilePage] Error submitting profile update:", err);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!authUser && !isLoading) { // Check !isLoading to ensure auth check completed
    // This state should ideally be caught by the redirect in onAuthStateChange
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }
  
  if (error && !profile && authUser) { // Error fetching profile, but user is authenticated
     return (
      <div className="text-center py-12 max-w-md mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error Loading Profile</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => authUser && fetchProfileData(authUser)}>Try Again</Button>
         <p className="text-xs text-muted-foreground mt-4">User ID: {authUser.id}. Email: {authUser.email}.</p>
      </div>
    );
  }
  
  // Case where authUser exists, no error, but profile is null (e.g., not created by trigger)
  // And not currently loading
  if (!profile && authUser && !isLoading) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-2">Profile Information Missing</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find detailed profile information for your account. 
        </p>
        <p className="text-sm text-muted-foreground">You can try to set your profile details below.</p>
        {!isEditing && (
             <Button onClick={() => setIsEditing(true)} className="mt-4">
                <Edit3 className="mr-2 h-4 w-4" /> Set Profile Details
            </Button>
        )}
         {/* Form will render if isEditing becomes true */}
      </div>
    )
  }

  // Render form if editing, or profile details if not editing AND profile exists
  if (!authUser) return null; // Should have been caught by loading or redirect

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        {!isEditing && profile && ( // Only show edit if profile exists
          <Button variant="outline" onClick={handleEditToggle}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      { (isEditing || !profile /* Allow form if editing OR if profile is null to create it */) ? (
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {isEditing ? "Edit Your Profile" : (profile?.full_name || authUser.email)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center text-muted-foreground">
                  <UserCircle className="mr-2 h-5 w-5 text-primary/80" /> Full Name
                </Label>
                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} disabled={isSaving} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-muted-foreground">
                  <Mail className="mr-2 h-5 w-5 text-primary/80" /> Email Address
                </Label>
                <Input id="email" name="email" value={authUser.email || ''} readOnly disabled className="bg-muted/50 cursor-not-allowed ml-7"/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center text-muted-foreground">
                  <Phone className="mr-2 h-5 w-5 text-primary/80" /> Phone Number
                </Label>
                <Input id="phone_number" name="phone_number" type="tel" value={formData.phone_number} onChange={handleInputChange} disabled={isSaving} placeholder="e.g., +911234567890" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center text-muted-foreground">
                  <MapPin className="mr-2 h-5 w-5 text-primary/80" /> Address
                </Label>
                <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} disabled={isSaving} placeholder="123 Main St, City, State, ZIP"/>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" onClick={handleEditToggle} disabled={isSaving}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      ) : profile ? ( // Display profile if not editing and profile exists
         <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {profile.full_name || authUser.email}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
               <div className="space-y-2">
                <Label htmlFor="p_full_name" className="flex items-center text-muted-foreground">
                  <UserCircle className="mr-2 h-5 w-5 text-primary/80" /> Full Name
                </Label>
                <p id="p_full_name" className="font-medium text-lg ml-7">{profile.full_name || <span className="italic text-muted-foreground/70">Not set</span>}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p_email" className="flex items-center text-muted-foreground">
                  <Mail className="mr-2 h-5 w-5 text-primary/80" /> Email Address
                </Label>
                <p id="p_email" className="font-medium text-lg ml-7">{authUser.email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p_phone_number" className="flex items-center text-muted-foreground">
                  <Phone className="mr-2 h-5 w-5 text-primary/80" /> Phone Number
                </Label>
                <p id="p_phone_number" className="font-medium text-lg ml-7">{profile.phone_number || <span className="italic text-muted-foreground/70">Not set</span>}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p_address" className="flex items-center text-muted-foreground">
                  <MapPin className="mr-2 h-5 w-5 text-primary/80" /> Address
                </Label>
                <p id="p_address" className="font-medium text-lg ml-7 whitespace-pre-line">{profile.address || <span className="italic text-muted-foreground/70">Not set</span>}</p>
              </div>
            </CardContent>
             <CardFooter className="pt-6">
                <p className="text-xs text-muted-foreground text-center w-full">
                    User ID: {profile.id}.
                </p>
            </CardFooter>
          </Card>
      ) : null /* Should be covered by loading or "Profile Information Missing" */ }
    </div>
  );
}
