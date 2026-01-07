'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, BookOpen, PenSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { BlogConfigModal } from '@/components/blog/BlogConfigModal';
import { getBlogPosts } from '@/lib/blog';
import { BlogPost, DEFAULT_BLOG_CATEGORIES } from '@/types/blogPost';
import Link from 'next/link';

export default function BlogPage() {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [configOpen, setConfigOpen] = useState(false);

  const isAdmin = userProfile?.role && ['admin', 'editor-in-chief'].includes(userProfile.role);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const data = await getBlogPosts({ status: 'published' });
        setPosts(data);
      } catch (error) {
        console.error('Error loading blog posts:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const filteredPosts = posts.filter(post => 
    category === 'all' || post.category === category
  );

  return (
    <div className="bg-slate-50/50 dark:bg-transparent min-h-screen">
      {/* Category Header */}
      <div className="bg-white dark:bg-card border-b border-border/50 py-6 mb-12 sticky top-[64px] z-10 shadow-sm">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={category === 'all' ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 rounded-full font-serif font-black uppercase text-[10px] tracking-widest transition-all ${
                category === 'all' ? 'shadow-lg bg-primary scale-105' : 'hover:bg-primary/10'
              }`}
              onClick={() => setCategory('all')}
            >
              All Stories
            </Badge>
            {DEFAULT_BLOG_CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                className={`cursor-pointer px-4 py-2 rounded-full font-serif font-black uppercase text-[10px] tracking-widest transition-all ${
                  category === cat ? 'shadow-lg bg-primary scale-105' : 'hover:bg-primary/10'
                }`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
               <Button variant="outline" size="icon" onClick={() => setConfigOpen(true)} className="rounded-full h-10 w-10 shadow-sm">
                  <Settings size={18} />
               </Button>
            )}
            <Button className="rounded-full px-6 font-black uppercase text-[10px] tracking-widest shadow-lg h-10 group" asChild>
              <Link href="/admin?action=new-article">
                <PenSquare size={14} className="mr-2 group-hover:rotate-12 transition-transform" /> Write Post
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-black mb-6 tracking-tight flex items-center gap-4">
            <Sparkles className="text-primary hidden md:block" size={48} />
            The Weekly Post
          </h1>
          <div className="h-1.5 w-40 bg-primary mb-6 rounded-full" />
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium">
            Discover unique local perspectives, deep-dive features, and community voices that define Western North Carolina.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <div className="lg:w-2/3">
             <BlogGrid posts={filteredPosts} loading={loading} />
          </div>

          {/* Sidebar */}
          <aside className="lg:w-1/3">
            <BlogSidebar />
          </aside>
        </div>
      </div>

      <BlogConfigModal 
        open={configOpen} 
        onClose={() => setConfigOpen(false)} 
      />
    </div>
  );
}
