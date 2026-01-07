'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/types/blogPost';
import { formatBlogDate } from '@/lib/blog';

interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col bg-card">
        {/* Image Section */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground/30 font-serif text-4xl italic">WNC</span>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground border-none">
              {post.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 grow space-y-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar size={14} className="text-primary" />
              {formatBlogDate(post.createdAt)}
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Eye size={14} className="text-primary" />
              {post.viewCount || 0} views
            </div>
          </div>

          <h3 className="text-2xl font-serif font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
            {post.excerpt}
          </p>
        </CardContent>

        <CardFooter className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt={post.authorName} className="w-8 h-8 rounded-full border border-border" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                {post.authorName[0]}
              </div>
            )}
            <span className="text-sm font-bold text-foreground line-clamp-1">{post.authorName}</span>
          </div>
          <span className="text-primary text-xs font-black flex items-center gap-1 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            Read Post <ArrowRight size={14} />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function BlogPostCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-border/50 animate-pulse bg-card">
      <div className="aspect-[16/9] bg-muted" />
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-4">
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
        <div className="h-4 bg-muted rounded w-16" />
      </CardFooter>
    </Card>
  );
}
