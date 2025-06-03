import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | TechGear',
  description: 'Login to your TechGear account.',
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoginForm />
    </div>
  );
}
