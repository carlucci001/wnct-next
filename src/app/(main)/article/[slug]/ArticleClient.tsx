"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Share2, Bookmark } from 'lucide-react';
import { getArticleBySlug, getArticlesByCategory } from '@/lib/articles';
import { getCategoryByName } from '@/lib/categories';
import { Article } from '@/types/article';
import { SiteConfig } from '@/types/siteConfig';
import Sidebar from '@/components/Sidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import ImageWithFallback from '@/components/ImageWithFallback';
import { AdDisplay } from '@/components/advertising/AdDisplay';
import { CommentSection } from '@/components/comments/CommentSection';
import Image from 'next/image';

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
      className="rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name?.[0] || "A").toUpperCase()}
    </div>
  );
}

const FALLBACK_COLORS: Record<string, string> = {
  news: '#1d4ed8',
  sports: '#dc2626',
  business: '#059669',
  entertainment: '#7c3aed',
  lifestyle: '#db2777',
  outdoors: '#16a34a',
};
const DEFAULT_COLOR = '#1d4ed8';

const getFallbackColor = (category: string): string => {
  return FALLBACK_COLORS[category?.toLowerCase()] || DEFAULT_COLOR;
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

export default function ArticleClient({ slug }: { slug: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryColor, setCategoryColor] = useState(DEFAULT_COLOR);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      const fetchedArticle = await getArticleBySlug(slug);
      setArticle(fetchedArticle);

      // Fetch site configuration for social links
      try {
        const configResponse = await fetch('/api/site-config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          setSiteConfig(configData);
        }
      } catch (error) {
        console.error('Failed to load site config:', error);
      }

      if (fetchedArticle?.category) {
        const categoryData = await getCategoryByName(fetchedArticle.category);
        if (categoryData?.color) {
          setCategoryColor(categoryData.color);
        } else {
          setCategoryColor(getFallbackColor(fetchedArticle.category));
        }

        const categoryArticles = await getArticlesByCategory(fetchedArticle.category);
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

  const handleShare = (platform: 'facebook' | 'twitter' | 'native') => {
    if (!article) return;

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const title = encodeURIComponent(article.title);
    const url = encodeURIComponent(currentUrl);

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`, '_blank', 'width=600,height=400');
    } else if (platform === 'native' && navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt || article.title,
        url: currentUrl,
      }).catch(err => console.log('Share failed', err));
    }
  };

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

  const articleDate = formatDate(article.publishedAt || article.createdAt || article.date);
  const featuredImageUrl = article.featuredImage || article.imageUrl || '/placeholder.jpg';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/' },
            { label: article.category, path: `/category/${article.category?.toLowerCase()}` },
            { label: article.title }
          ]}
        />

        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          <main className="lg:w-2/3">
            <article className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 md:p-8">
                <Link
                  href={`/category/${article.category?.toLowerCase()}`}
                  className="inline-block px-3 py-1 text-xs font-bold uppercase text-white rounded mb-4"
                  style={{ backgroundColor: categoryColor }}
                >
                  {article.category}
                </Link>

                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight mb-4">
                  {article.title}
                </h1>

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

                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Share:</span>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                    title="Share on Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
                    title="Share on X"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </button>
                  <button
                    onClick={() => handleShare('native')}
                    className="p-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-slate-600 transition"
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                  <button className="p-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-slate-600 transition ml-auto" title="Bookmark">
                    <Bookmark size={16} />
                  </button>
                </div>

                {/* Follow Us Links from Site Configuration */}
                {siteConfig?.social && (siteConfig.social.facebook || siteConfig.social.twitter || siteConfig.social.instagram) && (
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Follow us:</span>
                    {siteConfig.social.facebook && (
                      <a
                        href={siteConfig.social.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                        title="Follow us on Facebook"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </a>
                    )}
                    {siteConfig.social.twitter && (
                      <a
                        href={siteConfig.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
                        title="Follow us on X"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    )}
                    {siteConfig.social.instagram && (
                      <a
                        href={siteConfig.social.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-linear-to-br from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition"
                        title="Follow us on Instagram"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                    )}
                    {siteConfig.social.linkedin && (
                      <a
                        href={siteConfig.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition"
                        title="Follow us on LinkedIn"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                    )}
                    {siteConfig.social.youtube && (
                      <a
                        href={siteConfig.social.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                        title="Follow us on YouTube"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    )}
                  </div>
                )}
              </div>

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

              <div className="p-6 md:p-8">
                {article.excerpt && (
                  <p className="text-xl text-gray-700 dark:text-gray-300 font-serif leading-relaxed mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                    {article.excerpt}
                  </p>
                )}

                {article.content && (
                  <div className="article-content prose dark:prose-invert max-w-none">
                    {(() => {
                      const paragraphs = article.content.split('</p>');
                      if (paragraphs.length <= 3) {
                        return <div dangerouslySetInnerHTML={{ __html: article.content }} />;
                      }
                      
                      const midPoint = Math.floor(paragraphs.length / 2);
                      const beforeAd = paragraphs.slice(0, midPoint).join('</p>') + '</p>';
                      const afterAd = paragraphs.slice(midPoint).join('</p>');
                      
                      return (
                        <>
                          <div dangerouslySetInnerHTML={{ __html: beforeAd }} />
                          <div className="my-10 py-6 border-y border-gray-100 dark:border-slate-700">
                            <AdDisplay position="article_inline" />
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: afterAd }} />
                        </>
                      );
                    })()}
                  </div>
                )}

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

            <CommentSection articleId={article.id} articleTitle={article.title} />

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

          <aside className="lg:w-1/3">
            <Sidebar trendingArticles={relatedArticles} />
          </aside>
        </div>
      </div>
    </div>
  );
}
