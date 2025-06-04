
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
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();
  const isMounted = useRef(false);
  const initialAuthCheckDone = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    console.log("[ProfilePage] ComponentDidMount: isMounted.current = true");
    return () => {
      isMounted.current = false;
      console.log("[ProfilePage] ComponentWillUnmount: isMounted.current = false");
    };
  }, []);

  // Effect for handling authentication state
  useEffect(() => {
    console.log("[ProfilePage] AuthEffect: RUNNING. Current isLoading:", isLoading, "initialAuthCheckDone:", initialAuthCheckDone.current);
    
    const handleUserSession = (user: AuthUser | null, source: string) => {
      if (!isMounted.current) {
        console.log(`[ProfilePage] AuthEffect (${source}): NOT MOUNTED, skipping setAuthUser.`);
        return;
      }
      console.log(`[ProfilePage] AuthEffect (${source}): Setting authUser to:`, user?.id || null);
      setAuthUser(user);

      if (!initialAuthCheckDone.current) {
        setIsLoading(false);
        initialAuthCheckDone.current = true;
        console.log(`[ProfilePage] AuthEffect (${source}): FIRST auth determination. setIsLoading(false) CALLED. initialAuthCheckDone = true.`);
      } else {
        console.log(`[ProfilePage] AuthEffect (${source}): Subsequent auth update. isLoading remains:`, isLoading, "authUser is now:", user?.id || null);
      }
    };
    
    // Initial check with getSession
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[ProfilePage] AuthEffect (getSession.then): Initial session User ID:", session?.user?.id || "None");
      handleUserSession(session?.user ?? null, "getSession.then");
    }).catch((err) => {
      if (!isMounted.current) return;
      console.error("[ProfilePage] AuthEffect (getSession.catch): Error:", err.message);
      handleUserSession(null, "getSession.catch");
    });

    // Listener for subsequent auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[ProfilePage] AuthEffect (onAuthStateChange): Event:", event, "Session User ID:", session?.user?.id || "None");
      handleUserSession(session?.user ?? null, `onAuthStateChange(${event})`);
    });

    return () => {
      console.log("[ProfilePage] AuthEffect: CLEANUP. Unsubscribing auth listener.");
      authListener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Effect for fetching profile data when authUser is available
  useEffect(() => {
    console.log("[ProfilePage] DataEffect: RUNNING. authUser:", authUser?.id || null, "Current isFetchingProfile:", isFetchingProfile);
    const fetchUserProfileData = async (currentUser: AuthUser) => {
      if (!isMounted.current) {
        console.log("[ProfilePage] DataEffect (fetchUserProfileData): NOT MOUNTED, skipping fetch.");
        return;
      }
      if (isFetchingProfile && profile?.id === currentUser.id) { 
        console.log(`[ProfilePage] DataEffect (fetchUserProfileData): Already fetching or profile loaded for user ${currentUser.id}. Skipping.`);
        return;
      }

      console.log("[ProfilePage] DataEffect (fetchUserProfileData): Attempting to fetch for user:", currentUser.id);
      setIsFetchingProfile(true);
      console.log("[ProfilePage] DataEffect (fetchUserProfileData): setIsFetchingProfile(true) CALLED.");
      setError(null);
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single<SupabaseProfile>();

        if (!isMounted.current) {
            console.log("[ProfilePage] DataEffect (fetchUserProfileData try): NOT MOUNTED after fetch, skipping state updates.");
            return;
        }
        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        
        console.log("[ProfilePage] DataEffect (fetchUserProfileData try): Fetched profile data:", data ? data.id : null);
        setProfile(data);
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            phone_number: data.phone_number || '',
            address: data.address || '',
          });
        } else {
          console.warn(`[ProfilePage] DataEffect (fetchUserProfileData try): Profile data not found for user ID: ${currentUser.id}.`);
        }
      } catch (err: any) {
        if (!isMounted.current) {
            console.log("[ProfilePage] DataEffect (fetchUserProfileData catch): NOT MOUNTED after error, skipping state updates.");
            return;
        }
        console.error("[ProfilePage] DataEffect (fetchUserProfileData catch): Error fetching profile:", err.message);
        setError(err.message || "Could not fetch your profile data.");
        setProfile(null);
      } finally {
        if (isMounted.current) {
          setIsFetchingProfile(false);
          console.log("[ProfilePage] DataEffect (fetchUserProfileData finally): setIsFetchingProfile(false) CALLED.");
        } else {
          console.log("[ProfilePage] DataEffect (fetchUserProfileData finally): NOT MOUNTED, did not call setIsFetchingProfile(false).");
        }
      }
    };

    if (authUser) {
      fetchUserProfileData(authUser);
    } else {
      console.log("[ProfilePage] DataEffect: authUser is null. Clearing profile and ensuring isFetchingProfile is false.");
      setProfile(null);
      setFormData({ full_name: '', phone_number: '', address: '' });
      if (isFetchingProfile) { 
        setIsFetchingProfile(false);
        console.log("[ProfilePage] DataEffect: authUser is null, setIsFetchingProfile(false) CALLED because it was true.");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]); 

  // Effect for redirecting if not authenticated (and not loading)
  useEffect(() => {
    console.log("[ProfilePage] RedirectEffect: RUNNING. isLoading:", isLoading, "authUser:", authUser?.id || null, "initialAuthCheckDone:", initialAuthCheckDone.current);
    if (!isLoading && !authUser && isMounted.current && initialAuthCheckDone.current) {
      console.log("[ProfilePage] RedirectEffect: Conditions met. Redirecting to /login.");
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
    console.log("[ProfilePage] handleSubmit: Submitting form data:", formData);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      console.log("[ProfilePage] handleSubmit: API response:", result);

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
      console.error("[ProfilePage] handleSubmit: Network or unexpected error:", err);
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
      setError("Could not connect to the server.");
    } finally {
      if (isMounted.current) setIsSaving(false); 
    }
  };

  console.log("[ProfilePage] RENDER: isLoading:", isLoading, "authUser:", authUser?.id || null, "isFetchingProfile:", isFetchingProfile, "profile:", profile?.id || null, "isEditing:", isEditing);
  console.log("[ProfilePage] RENDER: isSaving value before render:", isSaving);


  if (isLoading) {
    console.log("[ProfilePage] RENDER: Showing main loader (isLoading is true).");
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying session...</p>
      </div>
    );
  }
  
  if (!authUser && initialAuthCheckDone.current) { 
    console.log("[ProfilePage] RENDER: No authUser, initial check done. Redirect should occur. Showing redirecting message.");
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Session not found. Redirecting to login...</p>
      </div>
    );
  }
  
  if (authUser && isFetchingProfile && !profile) { 
    console.log("[ProfilePage] RENDER: authUser exists, isFetchingProfile is true, no profile yet. Showing profile loader.");
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading profile data...</p>
      </div>
    );
  }
  
  if (error && !profile && !isEditing && authUser) { 
     console.log("[ProfilePage] RENDER: Error fetching profile, not editing. Showing error message.");
     return (
      <div className="text-center py-12 max-w-md mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error Loading Profile Data</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => { if(authUser) { console.log("[ProfilePage] RENDER: Retrying profile fetch."); router.refresh(); } }}>Try Again</Button>
         <p className="text-xs text-muted-foreground mt-4">User ID: {authUser.id}. Email: {authUser.email}.</p>
      </div>
    );
  }
  
  if (authUser && !profile && !isEditing && !isFetchingProfile) { 
    console.log("[ProfilePage] RENDER: authUser exists, no profile, not editing, not fetching. Showing 'Set Up Profile'.");
    return (
      <div className="text-center py-12 max-w-md mx-auto">
        <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-2">Set Up Your Profile</h1>
        <p className="text-muted-foreground mb-6">
          Your detailed profile information (name, phone, address) has not been set up yet.
        </p>
        <Button onClick={() => { setIsEditing(true); setError(null); }} className="mt-4" disabled={isSaving}>
            <Edit3 className="mr-2 h-4 w-4" /> Set Profile Details
        </Button>
         <p className="text-xs text-muted-foreground mt-6">Email: {authUser.email}</p>
      </div>
    );
  }

  console.log("[ProfilePage] RENDER: Showing main content (edit form or profile display).");
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        { (profile || isEditing || authUser) && ( 
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
                <Input id="email_display" name="email_display" value={authUser?.email || ''} readOnly disabled className="bg-muted/50 cursor-not-allowed"/>
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
      ) : profile && authUser ? ( 
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
        <div className="text-center py-12">
            {authUser ? (
                <>
                    <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h1 className="text-3xl font-bold mb-2">Profile Information</h1>
                    <p className="text-muted-foreground">Preparing your profile view. If this persists, try refreshing.</p>
                    <p className="text-xs text-muted-foreground mt-4">User: {authUser.email}</p>
                </>
            ) : (
                 <p className="text-muted-foreground">Loading session information...</p>
            )}
        </div>
      )
    }
    </div>
  );
}
