"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getArticles } from "@/lib/articles";
import { Article } from "@/types/article";
import HeroSection from "@/components/HeroSection";
import Sidebar from "@/components/Sidebar";
import ImageWithFallback from "@/components/ImageWithFallback";

// Category display order
const CATEGORY_ORDER = ['news', 'sports', 'business', 'entertainment', 'lifestyle', 'outdoors'];

// Default category colors
const CATEGORY_COLORS: Record<string, string> = {
  news: '#1d4ed8',
  sports: '#dc2626',
  business: '#059669',
  entertainment: '#7c3aed',
  lifestyle: '#db2777',
  outdoors: '#16a34a',
};

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      const data = await getArticles();
      setArticles(data);
      setLoading(false);
    }
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-serif animate-pulse">Loading WNC Times...</p>
        </div>
      </div>
    );
  }

  // Hero: Get latest FEATURED article from each category (1 per category)
  const getHeroArticles = (): Article[] => {
    const heroArticles: Article[] = [];

    CATEGORY_ORDER.forEach(categoryName => {
      const categoryArticles = articles.filter(
        a => a.category?.toLowerCase() === categoryName.toLowerCase()
      );

      // First try to find a featured article, fall back to latest
      const featured = categoryArticles.find(a => a.isFeatured);
      const articleToUse = featured || categoryArticles[0];

      if (articleToUse) {
        // Always use computed color from CATEGORY_COLORS to ensure consistency
        heroArticles.push({
          ...articleToUse,
          categoryColor: CATEGORY_COLORS[categoryName.toLowerCase()] || '#1d4ed8'
        });
      }
    });

    return heroArticles;
  };

  const heroArticles = getHeroArticles();
  const heroMain = heroArticles[0];
  const heroSub = heroArticles.slice(1, 6);
  const trendingArticles = articles.slice(0, 5);

  // Get unique categories from articles
  const getUniqueCategories = (): string[] => {
    const categorySet = new Set<string>();
    articles.forEach(article => {
      if (article.category) {
        categorySet.add(article.category);
      }
    });

    // Sort by predefined order, unknown categories go to end
    return Array.from(categorySet).sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a.toLowerCase());
      const bIndex = CATEGORY_ORDER.indexOf(b.toLowerCase());
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  };

  // Get articles for a specific category (1 featured + 4 trailing)
  const getArticlesByCategory = (categoryName: string): Article[] => {
    const categoryLower = categoryName.toLowerCase();

    return articles
      .filter(article => article.category.toLowerCase() === categoryLower)
      .sort((a, b) => {
        // Featured first, then by date
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;

        const dateA = new Date(a.publishedAt || a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  };

  const getCategoryColor = (category: string): string => {
    return CATEGORY_COLORS[category.toLowerCase()] || '#1d4ed8';
  };

  const categories = getUniqueCategories();

  return (
    <main className="bg-white">
      <div className="container mx-auto px-4 md:px-0 pt-4">
        {/* Hero Section */}
        {heroMain && <HeroSection mainArticle={heroMain} subArticles={heroSub} />}

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Column */}
          <div className="lg:w-2/3">

            {/* Dynamic Category Sections */}
            {categories.map(category => {
              const categoryArticles = getArticlesByCategory(category);

              if (categoryArticles.length === 0) return null;

              const featuredArticle = categoryArticles[0];
              const trailingArticles = categoryArticles.slice(1, 5);
              const categoryColor = featuredArticle.categoryColor || getCategoryColor(category);
              const categorySlug = category.toLowerCase().replace(/\s+/g, '-');

              return (
                <div key={category} className="mb-12">
                  {/* Section Header */}
                  <div
                    className="flex justify-between items-end mb-6 border-b-2 pb-2"
                    style={{ borderBottomColor: '#e5e7eb' }}
                  >
                    <h2
                      className="text-2xl font-serif font-bold text-gray-900 border-b-2 -mb-2.5 pb-2"
                      style={{ borderBottomColor: categoryColor }}
                    >
                      {category}
                    </h2>
                    <Link
                      href={`/category/${categorySlug}`}
                      className="text-sm font-bold hover:underline flex items-center"
                      style={{ color: categoryColor }}
                    >
                      View All <ArrowRight size={14} className="ml-1"/>
                    </Link>
                  </div>

                  {/* Category Content: 1 Featured + 4 Trailing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Featured Article */}
                    <Link href={`/article/${featuredArticle.slug || featuredArticle.id}`} className="group">
                      <div className="relative overflow-hidden rounded-lg mb-3 h-64">
                        <ImageWithFallback
                          src={featuredArticle.featuredImage || featuredArticle.imageUrl || '/placeholder.jpg'}
                          alt={featuredArticle.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <span
                          className="absolute top-3 left-3 z-10 text-white text-xs font-bold px-3 py-1 uppercase rounded shadow-md"
                          style={{ backgroundColor: categoryColor }}
                        >
                          {category}
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition leading-tight">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {featuredArticle.excerpt}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="font-medium">{featuredArticle.author}</span>
                        <span className="mx-2">•</span>
                        <span>{featuredArticle.date || featuredArticle.publishedAt}</span>
                      </div>
                    </Link>

                    {/* Right: 4 Trailing Articles */}
                    <div className="flex flex-col gap-4">
                      {trailingArticles.map((article) => (
                        <Link
                          key={article.id}
                          href={`/article/${article.slug || article.id}`}
                          className="flex gap-3 pb-4 border-b border-gray-200 last:border-0 last:pb-0 group"
                        >
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded relative">
                            <ImageWithFallback
                              src={article.featuredImage || article.imageUrl || '/placeholder.jpg'}
                              alt={article.title}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-105"
                              sizes="96px"
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-serif text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition leading-tight line-clamp-2">
                              {article.title}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {article.excerpt}
                            </p>
                            <span className="text-xs text-gray-500">{article.date || article.publishedAt}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* In-Feed Ad Placeholder */}
            <div className="w-full h-[120px] bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm mb-12 rounded">
              Advertisement (Full Width)
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="lg:w-1/3">
            <Sidebar trendingArticles={trendingArticles} />
          </div>
        </div>
      </div>
    </main>
  );
}