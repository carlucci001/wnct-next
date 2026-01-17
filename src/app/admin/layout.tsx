'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/types/user';
import AdminChatAssistant from '@/components/admin/AdminChatAssistant';

// Roles that have access to the admin panel
const ADMIN_ROLES: UserRole[] = [
  'admin',
  'business-owner',
  'editor-in-chief',
  'editor',
  'content-contributor',
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!role) {
        // Not logged in
        router.push('/login');
      } else if (!ADMIN_ROLES.includes(role)) {
        // Logged in but no admin access
        router.push('/');
      }
    }
  }, [role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or no admin role
  if (!role || !ADMIN_ROLES.includes(role)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Admin has its own standalone layout - no header/footer from main site
  return (
    <>
      {children}
      <AdminChatAssistant />
    </>
  );
}
