
"use client";

import { useState, useEffect, type FormEvent, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UserCircle, Mail, Phone, MapPin, Edit3, Save, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import type { SupabaseProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Effect for handling authentication state
  useEffect(() => {
    console.log("[ProfilePage] Auth Effect: Setting up onAuthStateChange listener.");
    setIsLoading(true); // Start loading when checking auth state

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted.current) return;
      console.log("[ProfilePage] Auth Effect: onAuthStateChange event:", event, "Session user:", session?.user?.id || "None");
      const currentUser = session?.user ?? null;
      setAuthUser(currentUser);
      if (!currentUser) { // If no user, stop overall loading and prepare for redirect
        setProfile(null);
        setFormData({ full_name: '', phone_number: '', address: '' });
        setIsEditing(false);
        setIsLoading(false);
      }
      // If there is a user, data fetching effect will handle its loading state
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted.current) return;
        console.log("[ProfilePage] Auth Effect: Initial getSession. User:", session?.user?.id || "None");
        const currentUser = session?.user ?? null;
        setAuthUser(currentUser);
        if (!currentUser) {
            setIsLoading(false); // No user from initial session, stop loading
        }
    }).catch(err => {
        if (!isMounted.current) return;
        console.error("[ProfilePage] Auth Effect: Error in initial getSession:", err);
        setAuthUser(null);
        setIsLoading(false); // Error, stop loading
    });

    return () => {
      authListener.subscription.unsubscribe();
      console.log("[ProfilePage] Auth Effect: Unsubscribed auth listener.");
    };
  }, []);

  // Effect for fetching profile data when authUser is available
  useEffect(() => {
    const fetchUserProfileData = async (currentUser: AuthUser) => {
      if (!isMounted.current) return;
      console.log("[ProfilePage] Data Effect: Fetching profile for user:", currentUser.id);
      setIsFetchingProfile(true);
      setError(null);
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single<SupabaseProfile>();

        if (!isMounted.current) return;
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        
        setProfile(data);
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            phone_number: data.phone_number || '',
            address: data.address || '',
          });
        } else {
          console.warn(`[ProfilePage] Data Effect: Profile data not found for user ID: ${currentUser.id}.`);
        }
      } catch (err: any) {
        if (!isMounted.current) return;
        console.error("[ProfilePage] Data Effect: Error fetching profile:", err);
        setError(err.message || "Could not fetch your profile data.");
        setProfile(null);
      } finally {
        if (isMounted.current) {
          setIsFetchingProfile(false);
          setIsLoading(false); // Overall loading stops after auth check AND profile fetch attempt
          console.log("[ProfilePage] Data Effect: Finished fetching profile. isLoading set to false.");
        }
      }
    };

    if (authUser) {
      fetchUserProfileData(authUser);
    } else {
        // If authUser becomes null (e.g. logout after initial load), ensure loading stops
        if (!isLoading && isMounted.current) { // Check !isLoading to avoid race with initial auth check
             // This case is mostly handled by auth effect, but as a safeguard
        }
    }
  }, [authUser]); // Runs when authUser state changes

  // Effect for redirecting if not authenticated (and not loading)
  useEffect(() => {
    if (!isLoading && !authUser && isMounted.current) {
      console.log("[ProfilePage] Redirect Effect: Not loading, no authUser. Redirecting to login.");
      router.push('/login?message=Please login to view your profile.&source=profilepage_redirect_effect');
    }
  }, [isLoading, authUser, router]);


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
      setError(null); 
    } else if (!isEditing && !profile) {
       setFormData({ full_name: '', phone_number: '', address: '' }); 
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
    setError(null); 
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!isMounted.current) return;

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
        setError(errorMsg || "Failed to save profile.");
      }
    } catch (err) {
      if (!isMounted.current) return;
      console.error("[ProfilePage] Error submitting profile update:", err);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
      setError("Could not connect to the server.");
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  };

  if (isLoading || (authUser && isFetchingProfile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }
  
  // If not loading and no authenticated user, redirect is handled by an effect. Show interim message.
  if (!authUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Session not found. Redirecting to login...</p>
      </div>
    );
  }
  
  // If authenticated but there was an error fetching profile data (and not currently editing to fix it)
  if (error && !profile && !isEditing) { 
     return (
      <div className="text-center py-12 max-w-md mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error Loading Profile Data</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => { if(authUser) { setIsLoading(true); /* fetchUserProfileData will be triggered by authUser effect */ } }}>Try Again</Button>
         <p className="text-xs text-muted-foreground mt-4">User ID: {authUser.id}. Email: {authUser.email}.</p>
      </div>
    );
  }
  
  // If authenticated, no error, but profile is null and not editing (i.e., first time setup)
  if (!profile && !isEditing) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-2">Set Up Your Profile</h1>
        <p className="text-muted-foreground mb-6">
          Your detailed profile information (name, phone, address) has not been set up yet.
        </p>
        <Button onClick={() => { setIsEditing(true); setError(null); }} className="mt-4">
            <Edit3 className="mr-2 h-4 w-4" /> Set Profile Details
        </Button>
         <p className="text-xs text-muted-foreground mt-6">Email: {authUser.email}</p>
      </div>
    );
  }

  // Default view: display profile or edit form
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        { (profile || isEditing) && ( // Show edit/cancel button if profile exists or if in edit mode for new profile
            <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}>
            {isEditing ? <><XCircle className="mr-2 h-4 w-4" /> Cancel</> : <><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</>}
          </Button>
        )}
      </div>

      { isEditing ? (
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {profile ? "Edit Your Profile" : "Set Your Profile Details"}
              </CardTitle>
              {error && !isSaving && <p className="text-sm text-destructive pt-2">{error}</p>}
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center text-muted-foreground">
                  <UserCircle className="mr-2 h-5 w-5 text-primary/80" /> Full Name
                </Label>
                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} disabled={isSaving} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_display" className="flex items-center text-muted-foreground">
                  <Mail className="mr-2 h-5 w-5 text-primary/80" /> Email Address
                </Label>
                <Input id="email_display" name="email_display" value={authUser.email || ''} readOnly disabled className="bg-muted/50 cursor-not-allowed"/>
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
      ) : profile ? ( 
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
      ) : (
        // Fallback if somehow authUser exists but profile is still null and not in edit mode (should be rare)
        <div className="text-center py-12">
             <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold mb-2">Profile Information</h1>
            <p className="text-muted-foreground">Preparing your profile view...</p>
        </div>
      )
    }
    </div>
  );
}
