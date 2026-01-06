"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Share2, Bookmark } from 'lucide-react';
import { getArticleBySlug, getArticlesByCategory } from '@/lib/articles';
import { sanitizeHtml } from '@/lib/security';
import { Article } from '@/types/article';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import ImageWithFallback from '@/components/ImageWithFallback';

function AuthorAvatar({ name, photoURL, size = 24 }: { name: string; photoURL?: string; size?: number }) {
  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name?.[0] || "A").toUpperCase()}
    </div>
  );
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  news: '#1d4ed8',
  sports: '#dc2626',
  business: '#059669',
  entertainment: '#7c3aed',
  lifestyle: '#db2777',
  outdoors: '#16a34a',
};

const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category?.toLowerCase()] || '#1d4ed8';
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export default function ArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      const fetchedArticle = await getArticleBySlug(slug);
      setArticle(fetchedArticle);

      if (fetchedArticle?.category) {
        const categoryArticles = await getArticlesByCategory(fetchedArticle.category);
        // Filter out current article and limit to 4
        setRelatedArticles(
          categoryArticles
            .filter(a => a.id !== fetchedArticle.id)
            .slice(0, 4)
        );
      }

      setLoading(false);
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const categoryColor = getCategoryColor(article.category);
  const articleDate = formatDate(article.publishedAt || article.createdAt || article.date);
  const featuredImageUrl = article.featuredImage || article.imageUrl || '/placeholder.jpg';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: article.category, path: `/category/${article.category?.toLowerCase()}` },
            { label: article.title }
          ]}
        />

        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          {/* Main Content */}
          <main className="lg:w-2/3">
            <article className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
              {/* Article Header */}
              <div className="p-6 md:p-8">
                {/* Category Badge */}
                <Link
                  href={`/category/${article.category?.toLowerCase()}`}
                  className="inline-block px-3 py-1 text-xs font-bold uppercase text-white rounded mb-4"
                  style={{ backgroundColor: categoryColor }}
                >
                  {article.category}
                </Link>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight mb-4">
                  {article.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <AuthorAvatar name={article.author} photoURL={article.authorPhotoURL} size={28} />
                    <span className="font-medium">{article.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400 dark:text-gray-500" />
                    <time dateTime={article.publishedAt || article.createdAt}>
                      {articleDate}
                    </time>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Share:</span>
                  <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition" title="Share on Facebook">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </button>
                  <button className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition" title="Share on X">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button className="p-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-slate-600 transition" title="Share">
                    <Share2 size={16} />
                  </button>
                  <button className="p-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-slate-600 transition ml-auto" title="Bookmark">
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>

              {/* Featured Image */}
              {(article.featuredImage || article.imageUrl) && (
                <div className="w-full relative h-[400px] md:h-[500px]">
                  <ImageWithFallback
                    src={featuredImageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="p-6 md:p-8">
                {article.excerpt && (
                  <p className="text-xl text-gray-700 dark:text-gray-300 font-serif leading-relaxed mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                    {article.excerpt}
                  </p>
                )}

                {article.content && (
                  <div
                    className="article-content prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
                  />
                )}

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b-2 border-gray-200 dark:border-slate-700">
                  More in{' '}
                  <span style={{ color: categoryColor }}>{article.category}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedArticles.map((related) => {
                    const relatedImageUrl = related.featuredImage || related.imageUrl || '/placeholder.jpg';
                    return (
                      <Link
                        key={related.id}
                        href={`/article/${related.slug || related.id}`}
                        className="group bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
                      >
                        <div className="aspect-video overflow-hidden relative">
                          <ImageWithFallback
                            src={relatedImageUrl}
                            alt={related.title}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-500"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-serif font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                            {related.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {formatDate(related.publishedAt || related.createdAt)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:w-1/3">
            <Sidebar trendingArticles={relatedArticles} />
          </aside>
        </div>
      </div>
    </div>
  );
}