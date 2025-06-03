
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserCircle, Mail, Phone, MapPin, Edit3, AlertTriangle } from 'lucide-react';
import type { SupabaseProfile } from '@/lib/types';

export const metadata: Metadata = {
  title: 'My Profile | TechGear',
  description: 'View and manage your TechGear profile information.',
};

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?message=Please login to view your profile.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<SupabaseProfile>();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error fetching profile:", profileError);
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-2">Error Loading Profile</h1>
        <p className="text-muted-foreground mb-6">Could not fetch your profile data. Please try again later.</p>
        <p className="text-xs text-muted-foreground">{profileError.message}</p>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="text-center py-12">
        <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find a profile associated with your account. 
          This might happen if your account setup wasn't fully completed.
        </p>
        <Link href="/">
            <Button variant="outline">Back to Home</Button>
        </Link>
         {/* Consider adding a button to "Complete Profile" or contact support if this state is common */}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold font-headline">My Profile</h1>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">
            {profile.full_name || 'Your Name'}
          </CardTitle>
          {/* <Link href="/profile/edit">
            <Button variant="outline" size="sm">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </Link> */}
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="flex items-center">
            <UserCircle className="mr-3 h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{profile.full_name || <span className="italic text-muted-foreground/70">Not set</span>}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Mail className="mr-3 h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Email Address</p>
              <p className="font-medium">{user.email}</p> {/* Email from auth.users */}
            </div>
          </div>
          <div className="flex items-center">
            <Phone className="mr-3 h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <p className="font-medium">{profile.phone_number || <span className="italic text-muted-foreground/70">Not set</span>}</p>
            </div>
          </div>
          <div className="flex items-center">
            <MapPin className="mr-3 h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{profile.address || <span className="italic text-muted-foreground/70">Not set</span>}</p>
            </div>
          </div>
          
          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
                Profile data is managed via Supabase. For changes, future "Edit Profile" functionality will interact with the 'profiles' table.
            </p>
            {/* Placeholder for Edit Profile button */}
            <Button variant="secondary" className="mt-4" disabled>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

