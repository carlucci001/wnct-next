'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/context/AuthContext';

// Icons (using simple text or SVG placeholders if lucide-react is not available, but I'll try to use text first to avoid deps issues or I can install lucide-react later if needed. For now, text labels are safer.)
// Actually, I can use some simple SVGs inline for better UX.

const SidebarItem = ({ href, label, active }: { href: string; label: string; active: boolean }) => (
  <Link
    href={href}
    className={`block px-4 py-2 mt-2 text-sm font-semibold rounded-lg ${
      active
        ? 'bg-gray-200 text-gray-900'
        : 'bg-transparent text-gray-900 hover:bg-gray-200 focus:text-gray-900 hover:text-gray-900 focus:bg-gray-200 focus:outline-none focus:shadow-outline'
    }`}
  >
    {label}
  </Link>
);

const AdminLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-white border-r border-gray-200 md:translate-x-0 md:static md:inset-0 ${isOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'}`}>
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center">
            <span className="mx-2 text-2xl font-semibold text-gray-800">WNC Times</span>
          </div>
        </div>

        <nav className="mt-10">
          <SidebarItem href="/admin" label="Dashboard" active={pathname === '/admin'} />
          <SidebarItem href="/admin/articles" label="Articles" active={pathname.startsWith('/admin/articles')} />
          <SidebarItem href="/admin/users" label="Users" active={pathname.startsWith('/admin/users')} />
          <SidebarItem href="/admin/categories" label="Categories" active={pathname.startsWith('/admin/categories')} />
          <SidebarItem href="/admin/settings" label="Settings" active={pathname.startsWith('/admin/settings')} />
        </nav>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 focus:outline-none md:hidden"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <span className="mr-4 text-sm text-gray-800 font-medium">
                {user?.email || 'Admin User'}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-500 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </ProtectedRoute>
    </AuthProvider>
  );
}
