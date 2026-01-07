'use client';

import React from 'react';
import { BlogPostCard, BlogPostCardSkeleton } from './BlogPostCard';
import { BlogPost } from '@/types/blogPost';
import { BookOpen } from 'lucide-react';

interface BlogGridProps {
  posts: BlogPost[];
  loading: boolean;
}

export function BlogGrid({ posts, loading }: BlogGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <BlogPostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-24 bg-card rounded-3xl border-2 border-dashed border-border/50 shadow-sm px-6">
        <BookOpen size={64} className="mx-auto mb-6 text-muted-foreground opacity-20" />
        <h3 className="text-2xl font-serif font-black mb-3">No blog posts found</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          We couldn&apos;t find any blog posts matching your criteria. Check back soon for new community voices!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
