"use client";

import { useState, useEffect } from 'react';
import { Settings, Search, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogGrid } from '@/components/blog/BlogGrid';
import { BlogSidebar } from '@/components/blog/BlogSidebar';
import { BlogConfigModal } from '@/components/blog/BlogConfigModal';
import { BlogPost, BlogSettings } from '@/types/blogPost';
import { getBlogPosts, getBlogSettings, initializeBlogSettings } from '@/lib/blog';

const DEFAULT_CATEGORIES = ['Opinion', 'Column', 'Guest Post', 'Lifestyle', 'Community'];

export default function BlogPage() {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);

  // Check if user is admin
  const isAdmin =
    userProfile?.role &&
    ['admin', 'business-owner', 'editor-in-chief'].includes(userProfile.role);

  // Fetch posts and settings
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [postsData, settingsData] = await Promise.all([
          getBlogPosts(),
          initializeBlogSettings(),
        ]);
        setPosts(postsData);
        setFilteredPosts(postsData);
        setSettings(settingsData);
        setVisibleCount(settingsData?.postsPerPage || 10);
      } catch (error) {
        console.error('Error fetching blog data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter posts by category and search query
  useEffect(() => {
    let result = posts;

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter((post) => post.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.authorName.toLowerCase().includes(query) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredPosts(result);
    setVisibleCount(settings?.postsPerPage || 10);
  }, [activeCategory, searchQuery, posts, settings?.postsPerPage]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // Handle settings update
  const handleSettingsUpdate = (newSettings: BlogSettings) => {
    setSettings(newSettings);
  };

  // Load more posts
  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + (settings?.postsPerPage || 10));
      setLoadingMore(false);
    }, 300);
  };

  const categories = settings?.categories || DEFAULT_CATEGORIES;
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMorePosts = visibleCount < filteredPosts.length;

  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN: Main Content (2/3 width on desktop) */}
        <div className="lg:w-2/3 flex flex-col w-full">
          {/* Header with title and admin gear icon */}
          <div className="mb-6 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                {settings?.title || 'Blog'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Opinion pieces, columns, and community voices
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfigOpen(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Settings size={20} />
              </Button>
            )}
          </div>

          {/* Search Bar - Mobile Only */}
          <div className="mb-4 lg:hidden">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Category Tabs - Mobile */}
          <div className="mb-6 lg:hidden overflow-x-auto">
            <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger value="all" className="flex-shrink-0">
                  All
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="flex-shrink-0">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Blog Grid */}
          <BlogGrid
            posts={visiblePosts}
            loading={loading}
            emptyMessage={
              searchQuery
                ? `No posts found matching "${searchQuery}"`
                : activeCategory !== 'all'
                ? `No posts found in the "${activeCategory}" category`
                : 'No blog posts yet. Check back soon!'
            }
          />

          {/* Load More Button */}
          {hasMorePosts && !loading && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full sm:w-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Posts
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Post count info */}
          {!loading && filteredPosts.length > 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Showing {visiblePosts.length} of {filteredPosts.length} posts
            </p>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar (1/3 width, hidden on mobile) */}
        <div className="lg:w-1/3 hidden lg:flex flex-col sticky top-24 space-y-6">
          {/* Search Bar - Desktop */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800"
            />
          </div>

          {/* Sidebar Components */}
          <BlogSidebar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            settings={settings}
          />
        </div>
      </div>

      {/* Config Modal */}
      <BlogConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onSettingsUpdate={handleSettingsUpdate}
      />
    </div>
  );
}
