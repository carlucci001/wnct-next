'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { can } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      router.push('/');
    }
    // TODO: Add role-based access check when user profiles are implemented
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;

  if (!user) return null;

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <nav>
          <ul>
            <li><a href="/admin/articles" className="block py-2">Articles</a></li>
            {can('create_users') && (
              <li><a href="/admin/users" className="block py-2">Users</a></li>
            )}
            {can('site_settings') && (
               <li><a href="/admin/settings" className="block py-2">Settings</a></li>
            )}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
