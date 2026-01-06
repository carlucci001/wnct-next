"use client";

import { BlogPost } from '@/types/blogPost';
import { BlogPostCard } from './BlogPostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface BlogGridProps {
  posts: BlogPost[];
  loading?: boolean;
  emptyMessage?: string;
}

// Skeleton card for loading state
function BlogPostCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-full">
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full rounded-none" />
      <CardContent className="p-4">
        {/* Title skeleton */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-2" />
        {/* Excerpt skeleton */}
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-4/5 mb-4" />
        {/* Meta skeleton */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <FileText size={32} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No posts found
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        {message}
      </p>
    </div>
  );
}

export function BlogGrid({ posts, loading = false, emptyMessage = "Check back later for new blog posts." }: BlogGridProps) {
  // Show loading skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <BlogPostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!posts || posts.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  // Show posts grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default BlogGrid;
