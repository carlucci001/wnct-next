'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogPostDetail } from '@/components/blog/BlogPostDetail';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { getBlogPostBySlug } from '@/lib/blog';
import { BlogPost } from '@/types/blogPost';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await getBlogPostBySlug(slug);
        if (data) {
          setPost(data);
        }
      } catch (error) {
        console.error('Error loading blog post:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen">
        <div className="animate-pulse space-y-12">
          <div className="h-10 bg-muted rounded w-32" />
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/4" />
          </div>
          <div className="aspect-[21/9] bg-muted rounded-[2rem]" />
          <div className="space-y-6">
            <div className="h-6 bg-muted rounded w-full" />
            <div className="h-6 bg-muted rounded w-full" />
            <div className="h-6 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-32 min-h-screen text-center">
        <div className="bg-card p-16 rounded-[3rem] border-2 border-dashed border-border shadow-xl max-w-2xl mx-auto">
          <BookOpen size={80} className="mx-auto mb-8 text-muted-foreground opacity-20" />
          <h1 className="text-4xl font-serif font-black mb-6">Post Not Found</h1>
          <p className="text-muted-foreground text-xl mb-10 leading-relaxed">
            The story you&apos;re looking for has either been moved or deleted from our archives.
          </p>
          <Button className="rounded-full px-10 h-14 font-black uppercase text-[10px] tracking-widest shadow-xl group" onClick={() => router.push('/blog')}>
            <ArrowLeft className="mr-2 group-hover:-translate-x-2 transition-transform" /> Browse All Stories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/30 dark:bg-transparent min-h-screen pb-20">
      <div className="container mx-auto px-4">
        {/* Progress Bar or Nav Link */}
        <div className="flex items-center justify-between py-6 mb-12 border-b border-border/50">
           <Button 
            variant="ghost" 
            className="rounded-full px-4 text-muted-foreground hover:text-primary transition-colors h-11 group font-bold uppercase text-[10px] tracking-widest" 
            onClick={() => router.push('/blog')}
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Archives
          </Button>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary opacity-60">
             <Sparkles size={14} /> Local Perspectives
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-20">
          {/* Main Content (2/3) */}
          <div className="lg:w-2/3">
            <BlogPostDetail post={post} />
          </div>

          {/* Sidebar (1/3) */}
          <aside className="lg:w-1/3">
            <BlogSidebar author={{ 
              authorName: post.authorName, 
              authorPhoto: post.authorPhoto,
              authorBio: post.authorBio 
            }} />
          </aside>
        </div>
      </div>
    </div>
  );
}
