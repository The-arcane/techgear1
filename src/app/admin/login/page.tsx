
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login | TechGear',
  description: 'Login to the TechGear Admin Panel.',
};

export default function AdminLoginPage() {
  return (
    <div className="flex items-center justify-center py-12">
      <AdminLoginForm />
    </div>
  );
}
