'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LayoutGrid, List as ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getArticlesByCategory } from '@/lib/articles';
import { getCategoryColor } from '@/lib/constants';
import CategoryFeaturedSlider from '@/components/CategoryFeaturedSlider';
import Sidebar from '@/components/Sidebar';
import ArticleCard from '@/components/ArticleCard';
import { Article } from '@/types/article';

// Helper to format date
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [decodedCategory, setDecodedCategory] = useState('');
  const itemsPerPage = 12;

  useEffect(() => {
    const loadData = async () => {
      const { category } = await params;
      const decoded = decodeURIComponent(category);
      setDecodedCategory(decoded);

      const fetchedArticles = await getArticlesByCategory(decoded);
      setArticles(fetchedArticles);
      setIsLoading(false);
    };
    loadData();
  }, [params]);

  // Reset pagination when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [decodedCategory]);

  // Slider articles: Top 3 (Featured > Newest)
  const sliderArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        const dateA = new Date(a.publishedAt || a.createdAt || '').getTime();
        const dateB = new Date(b.publishedAt || b.createdAt || '').getTime();
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [articles]);

  const accentColor = getCategoryColor(decodedCategory);

  // Pagination logic
  const totalItems = articles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentArticles = articles.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Avoid "News News" in title
  const pageTitle = decodedCategory.toLowerCase().endsWith('news')
    ? decodedCategory
    : `${decodedCategory} News`;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900">
      {/* 1. Category Featured Slider */}
      <div className="container mx-auto px-4 md:px-0 pt-6">
        <CategoryFeaturedSlider articles={sliderArticles} accentColor={accentColor} />
      </div>

      <div className="container mx-auto px-4 md:px-0 pb-8">
        {/* 2. Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-12 mt-8">
          {/* Main Content - 2/3 */}
          <div className="lg:w-2/3">
            {/* Header with Controls */}
            <header
              className="mb-8 border-b-2 pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4"
              style={{ borderBottomColor: accentColor }}
            >
              <div>
                <h1
                  className="text-3xl md:text-4xl font-serif font-bold capitalize"
                  style={{ color: accentColor }}
                >
                  {pageTitle}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Latest articles in {decodedCategory}
                </p>
              </div>

              {/* Grid/List Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 border border-gray-200 dark:border-zinc-700 self-start md:self-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  style={viewMode === 'grid' ? { color: accentColor } : {}}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  style={viewMode === 'list' ? { color: accentColor } : {}}
                  title="List View"
                >
                  <ListIcon size={18} />
                </button>
              </div>
            </header>

            {/* Article Feed */}
            {currentArticles.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-8'}>
                {currentArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant={viewMode === 'list' ? 'horizontal' : undefined}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 bg-gray-50 dark:bg-zinc-800 rounded">
                No articles found in this category.
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded transition font-medium ${
                      currentPage === page
                        ? 'text-white shadow-sm'
                        : 'border border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                    style={currentPage === page ? { backgroundColor: accentColor } : {}}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 */}
          <div className="lg:w-1/3">
            <Sidebar trendingArticles={articles.slice(0, 5)} />
          </div>
        </div>
      </div>
    </div>
  );
}
