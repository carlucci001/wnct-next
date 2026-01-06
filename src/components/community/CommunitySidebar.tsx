"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, MessageSquare, BookOpen, Heart, LogIn, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CommunityFiltersCompact } from './CommunityFilters';
import { CommunityPostData, getTrendingPosts, getCommunityStats } from '@/lib/communityPosts';
import { Timestamp } from 'firebase/firestore';

interface CommunitySidebarProps {
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  topics?: string[];
  isLoggedIn?: boolean;
}

interface CommunityStatsData {
  totalPosts: number;
  postsThisWeek: number;
  activeTopics: number;
}

function formatTimestamp(timestamp: Timestamp | Date | string): string {
  const date = timestamp instanceof Timestamp
    ? timestamp.toDate()
    : typeof timestamp === 'string'
      ? new Date(timestamp)
      : timestamp;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CommunitySidebar({
  selectedTopic,
  onTopicChange,
  topics,
  isLoggedIn = false,
}: CommunitySidebarProps) {
  const [trendingPosts, setTrendingPosts] = useState<CommunityPostData[]>([]);
  const [stats, setStats] = useState<CommunityStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSidebarData() {
      setIsLoading(true);
      try {
        const [trending, communityStats] = await Promise.all([
          getTrendingPosts(5),
          getCommunityStats(),
        ]);
        setTrendingPosts(trending);
        setStats(communityStats);
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSidebarData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Topic Quick Filters */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-600 dark:text-blue-400" />
            Browse Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommunityFiltersCompact
            selectedTopic={selectedTopic}
            onTopicChange={onTopicChange}
            topics={topics}
          />
        </CardContent>
      </Card>

      {/* Trending Posts */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-500" />
            Trending This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TrendingPostsSkeleton />
          ) : trendingPosts.length > 0 ? (
            <div className="space-y-3">
              {trendingPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="group flex gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="text-red-500" />
                        {post.likes}
                      </span>
                      <span>{formatTimestamp(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No trending posts this week
            </p>
          )}
        </CardContent>
      </Card>

      {/* Community Stats */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles size={18} className="text-purple-500" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <StatsSkeleton />
          ) : stats ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPosts}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total Posts
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.postsThisWeek}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  This Week
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.activeTopics}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Topics
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Unable to load stats
            </p>
          )}
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={18} className="text-gray-600 dark:text-gray-400" />
            Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-1 flex-shrink-0 text-gray-400" />
              Be respectful and constructive
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-1 flex-shrink-0 text-gray-400" />
              No spam or self-promotion
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-1 flex-shrink-0 text-gray-400" />
              Keep posts relevant to local community
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-1 flex-shrink-0 text-gray-400" />
              Report inappropriate content
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Join the Conversation CTA */}
      {!isLoggedIn && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Users size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Join the Conversation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Connect with your neighbors and stay informed about local happenings.
              </p>
              <Link href="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Skeleton components
function TrendingPostsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 p-2">
          <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-8 w-12 mx-auto mb-1" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      ))}
    </div>
  );
}
