'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessPartnerPortal } from '@/config/masterSite';
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  Users,
  Newspaper,
  LogOut,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { href: '/partner-portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partner-portal/settings', label: 'Site Settings', icon: Settings },
  { href: '/partner-portal/billing', label: 'Billing & Credits', icon: CreditCard },
  { href: '/partner-portal/team', label: 'Team', icon: Users },
];

export default function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login?redirect=/partner-portal');
        return;
      }

      // Check if user has a tenantId (is a paper partner)
      if (!canAccessPartnerPortal(userProfile?.tenantId)) {
        router.push('/paper-partner-program');
        return;
      }
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!currentUser || !canAccessPartnerPortal(userProfile?.tenantId)) {
    return null;
  }

  const displayName = userProfile?.displayName || currentUser.displayName || 'Partner';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-900 dark:text-white">Partner Portal</span>
          </div>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarImage src={userProfile?.photoURL || ''} alt={displayName} />
          <AvatarFallback className="bg-blue-600 text-white text-sm">{userInitial}</AvatarFallback>
        </Avatar>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Link href="/partner-portal" className="flex items-center gap-2">
                <Newspaper className="w-8 h-8 text-blue-600" />
                <span className="font-bold text-lg text-slate-900 dark:text-white">Partner Portal</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Back to Site */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600 dark:text-slate-400" asChild>
              <Link href="/">
                <ChevronLeft size={16} />
                Back to Site
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userProfile?.photoURL || ''} alt={displayName} />
                <AvatarFallback className="bg-blue-600 text-white">{userInitial}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{displayName}</p>
                <Badge variant="secondary" className="text-xs">Paper Partner</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-slate-600 dark:text-slate-400"
              onClick={() => signOut()}
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
