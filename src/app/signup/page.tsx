import { SignupForm } from "@/components/auth/SignupForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | TechGear',
  description: 'Create your TechGear account.',
};

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center py-12">
      <SignupForm />
    </div>
  );
}
