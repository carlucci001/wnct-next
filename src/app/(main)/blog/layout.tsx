'use client';

import React from 'react';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { BlogProvider } from './BlogProvider';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <BlogProvider>
      <div className="bg-slate-50/50 dark:bg-transparent min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            {/* Main Content (2/3) */}
            <main className="lg:w-2/3">
              {children}
            </main>

            {/* Sidebar (1/3) */}
            <aside className="lg:w-1/3">
              <BlogSidebar />
            </aside>
          </div>
        </div>
      </div>
    </BlogProvider>
  );
}
