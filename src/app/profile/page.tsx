
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
  const [isLoading, setIsLoading] = useState(true); // Default to true, set to false after initial load
  const [isSaving, setIsSaving] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  // Renamed fetchProfileData to avoid conflict with any potential global function if ever needed
  const fetchUserProfileData = async (currentUser: AuthUser) => {
    console.log("[ProfilePage] fetchUserProfileData called for user:", currentUser.id);
    setError(null);
    // setIsLoading(true) should be managed by the calling context (useEffect) for initial page load
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single<SupabaseProfile>();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no row found, not an error here
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
         console.warn(`[ProfilePage] Profile not found for user ID: ${currentUser.id}. This is normal if the user hasn't set up their profile yet.`);
         //setError("Your profile data could not be loaded. It might not have been created yet."); // Don't set error if profile is just null
      }
    } catch (err: any) {
      console.error("[ProfilePage] Error in fetchUserProfileData:", err);
      setError(err.message || "Could not fetch your profile data.");
      setProfile(null); // Clear profile on error
    } finally {
      console.log("[ProfilePage] fetchUserProfileData finished.");
      // setIsLoading(false) is handled by the onAuthStateChange callback after this function completes
    }
  };

  useEffect(() => {
    console.log("[ProfilePage] useEffect mounted.");
    // setIsLoading(true) is default state, so it's already true here for the initial run.

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[ProfilePage] onAuthStateChange event:", event, "Session:", !!session);
      const currentUser = session?.user ?? null;
      
      setAuthUser(currentUser); // Update authUser state immediately

      if (currentUser) {
        await fetchUserProfileData(currentUser); // Fetch profile if user exists
      } else {
        // No user, clear profile related states
        setProfile(null);
        setFormData({ full_name: '', phone_number: '', address: '' });
        setIsEditing(false); // Reset editing mode if user logs out/session ends
        setError(null); // Clear any previous errors
        if (event === 'INITIAL_SESSION' && !session) {
          // This means the very first auth check found no active session
          console.log("[ProfilePage] No initial session, redirecting to login.");
          router.push('/login?message=Please login to view your profile.&source=profilepage_initial_nouser');
        }
      }
      
      // After all processing (auth check + potential profile fetch), set loading to false.
      setIsLoading(false);
      console.log("[ProfilePage] onAuthStateChange finished. setIsLoading(false). AuthUser:", currentUser ? currentUser.id : 'null');
    });

    return () => {
      authListener.subscription.unsubscribe();
      console.log("[ProfilePage] useEffect cleanup. Unsubscribed auth listener.");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // router is stable and typically doesn't need to be in deps for this pattern


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing && profile) { 
      // If cancelling edit, revert form data to profile data
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
      });
      setError(null); // Clear any validation errors from edit mode
    } else if (!isEditing && !profile) {
      // Entering edit mode when profile is null, form is already empty or has defaults
       setFormData({ full_name: '', phone_number: '', address: '' }); // Ensure it's clean
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
    setError(null); // Clear previous errors
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
        setError(errorMsg || "Failed to save profile.");
      }
    } catch (err) {
      console.error("[ProfilePage] Error submitting profile update:", err);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
      setError("Could not connect to the server.");
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

  if (!authUser) { 
    // This state should ideally be handled by the redirect in useEffect,
    // but as a fallback if user gets logged out while on the page.
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Not Logged In</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to view your profile.</p>
        <Button onClick={() => router.push('/login?source=profilepage_render_notloggedin')}>Go to Login</Button>
      </div>
    );
  }
  
  // If authUser exists, but there was an error fetching profile (and profile is still null)
  if (error && !profile && !isEditing) { // Show error only if not in edit mode (trying to create profile)
     return (
      <div className="text-center py-12 max-w-md mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error Loading Profile</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => { setIsLoading(true); fetchUserProfileData(authUser); }}>Try Again</Button>
         <p className="text-xs text-muted-foreground mt-4">User ID: {authUser.id}. Email: {authUser.email}.</p>
      </div>
    );
  }
  
  // If authUser exists, no error yet, profile is null (or not yet loaded fully), and not in edit mode
  // This is the "Profile Information Missing" state, allowing user to enter edit mode.
  if (!profile && !isEditing) {
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-2">Profile Information</h1>
        <p className="text-muted-foreground mb-6">
          Your detailed profile information (name, phone, address) has not been set up yet.
        </p>
        <Button onClick={() => { setIsEditing(true); setError(null); /* Clear error when entering edit mode */ }} className="mt-4">
            <Edit3 className="mr-2 h-4 w-4" /> Set Profile Details
        </Button>
         <p className="text-xs text-muted-foreground mt-6">Email: {authUser.email}</p>
      </div>
    );
  }

  // If we are in editing mode, or if profile exists and we are not editing
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        {/* Show Edit/Cancel button only if not in initial "Set Profile Details" mode (i.e., profile existed or user chose to edit existing null profile) */}
        { (profile || isEditing) && (
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
              {error && <p className="text-sm text-destructive">{error}</p>}
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
                {/* Display email as read-only from authUser */}
                <Input id="email_display" name="email_display" value={authUser.email || ''} readOnly disabled className="bg-muted/50 cursor-not-allowed ml-7"/>
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
              {/* Cancel button always visible in edit mode */}
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
      ) : null /* Should not be reached if logic above is correct; profile is null but not editing is handled */ }
    </div>
  );
}
