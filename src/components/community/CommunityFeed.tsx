"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CommunityPost } from './CommunityPost';
import { CommunityPostData, getCommunityPosts, getPinnedPosts } from '@/lib/communityPosts';

interface CommunityFeedProps {
  topic?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  includeHidden?: boolean;
  initialPosts?: CommunityPostData[];
}

const POSTS_PER_PAGE = 10;

export function CommunityFeed({
  topic = 'all',
  currentUserId,
  isAdmin = false,
  includeHidden = false,
  initialPosts,
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPostData[]>(initialPosts || []);
  const [pinnedPosts, setPinnedPosts] = useState<CommunityPostData[]>([]);
  const [isLoading, setIsLoading] = useState(!initialPosts);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedPosts, fetchedPinnedPosts] = await Promise.all([
        getCommunityPosts({
          topic: topic !== 'all' ? topic : undefined,
          includeHidden: isAdmin && includeHidden,
        }),
        getPinnedPosts(),
      ]);

      setPosts(fetchedPosts);
      setPinnedPosts(fetchedPinnedPosts);
      setHasMore(fetchedPosts.length > POSTS_PER_PAGE);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [topic, isAdmin, includeHidden]);

  useEffect(() => {
    if (!initialPosts) {
      fetchPosts();
    }
  }, [fetchPosts, initialPosts]);

  // Refetch when topic changes
  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
    fetchPosts();
  }, [topic, fetchPosts]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => {
        const newCount = prev + POSTS_PER_PAGE;
        setHasMore(newCount < posts.length);
        return newCount;
      });
      setIsLoadingMore(false);
    }, 300);
  };

  const handleRefresh = () => {
    setVisibleCount(POSTS_PER_PAGE);
    fetchPosts();
  };

  // Filter out pinned posts from regular posts to avoid duplicates
  const pinnedPostIds = new Set(pinnedPosts.map((p) => p.id));
  const regularPosts = posts.filter((p) => !pinnedPostIds.has(p.id));
  const visiblePosts = regularPosts.slice(0, visibleCount);

  if (isLoading) {
    return <CommunityFeedSkeleton />;
  }

  if (posts.length === 0 && pinnedPosts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <RefreshCw size={24} className="text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          {topic !== 'all'
            ? `No posts in this topic yet. Be the first to share something!`
            : `The community feed is empty. Start a conversation!`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-gray-500 dark:text-gray-400"
        >
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Pinned Posts */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-4">
          {pinnedPosts.map((post) => (
            <CommunityPost
              key={`pinned-${post.id}`}
              post={post}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onUpdate={fetchPosts}
            />
          ))}
        </div>
      )}

      {/* Regular Posts */}
      <div className="space-y-4">
        {visiblePosts.map((post) => (
          <CommunityPost
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onUpdate={fetchPosts}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && visiblePosts.length < regularPosts.length && (
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full py-4 font-semibold text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {isLoadingMore ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load More Posts
                <ChevronDown size={16} className="ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* End of Feed Message */}
      {!hasMore && visiblePosts.length > 0 && (
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
          You've reached the end of the feed
        </div>
      )}
    </div>
  );
}

// Loading skeleton component
function CommunityFeedSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="ml-auto">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Footer */}
          <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { CommunityFeedSkeleton };
