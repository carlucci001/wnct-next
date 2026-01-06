"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Eye,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogPost, BlogSettings } from '@/types/blogPost';
import {
  getBlogPostBySlug,
  getBlogPostsByAuthor,
  getBlogPosts,
  getBlogSettings,
  incrementViewCount,
  calculateReadingTime,
} from '@/lib/blog';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [authorPosts, setAuthorPosts] = useState<BlogPost[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevPost, setPrevPost] = useState<BlogPost | null>(null);
  const [nextPost, setNextPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return;

      setLoading(true);
      try {
        const [postData, settingsData, allPosts] = await Promise.all([
          getBlogPostBySlug(slug),
          getBlogSettings(),
          getBlogPosts(),
        ]);

        if (postData) {
          setPost(postData);
          setSettings(settingsData);

          // Increment view count
          incrementViewCount(postData.id).catch(console.error);

          // Get author's other posts
          const authorPostsData = await getBlogPostsByAuthor(postData.authorId, { limitCount: 4 });
          setAuthorPosts(authorPostsData.filter((p) => p.id !== postData.id).slice(0, 3));

          // Get related posts from same category
          const related = allPosts
            .filter((p) => p.id !== postData.id && p.category === postData.category)
            .slice(0, 3);
          setRelatedPosts(related);

          // Get prev/next posts
          const currentIndex = allPosts.findIndex((p) => p.id === postData.id);
          if (currentIndex > 0) {
            setNextPost(allPosts[currentIndex - 1]);
          }
          if (currentIndex < allPosts.length - 1) {
            setPrevPost(allPosts[currentIndex + 1]);
          }
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  // Format date helper
  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format short date
  const formatShortDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Category color helper
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Opinion: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      Column: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Guest Post': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      Lifestyle: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      Community: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  // Share handlers
  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = post?.title || '';

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-0 py-6 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full mb-8 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Post not found
  if (!post) {
    return (
      <div className="container mx-auto px-4 md:px-0 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push('/blog')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>
      </div>
    );
  }

  const readingTime = calculateReadingTime(post.content);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Article Container */}
      <article className="container mx-auto px-4 md:px-0 py-6 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>

        {/* Category Badge */}
        <Badge className={`${getCategoryColor(post.category)} border-0 font-medium mb-4`}>
          {post.category}
        </Badge>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <div className="flex items-center gap-2">
            {post.authorPhoto ? (
              <Image
                src={post.authorPhoto}
                alt={post.authorName}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <User size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <span className="font-medium text-gray-700 dark:text-gray-300">{post.authorName}</span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {readingTime} min read
          </span>
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {post.viewCount || 0} views
          </span>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-8">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          {/* Simple content rendering - in production you'd use a markdown renderer */}
          {post.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-sm">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Share Section */}
        <div className="flex items-center justify-between py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-8">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Share this post:
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('facebook')}
              className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
            >
              <Facebook size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('twitter')}
              className="hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/30"
            >
              <Twitter size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('linkedin')}
              className="hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30"
            >
              <Linkedin size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleShare('copy')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LinkIcon size={18} />
            </Button>
          </div>
        </div>

        {/* Author Bio Card */}
        {settings?.showAuthorBio && post.authorBio && (
          <Card className="mb-8 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {post.authorPhoto ? (
                  <Image
                    src={post.authorPhoto}
                    alt={post.authorName}
                    width={64}
                    height={64}
                    className="rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <User size={28} className="text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {post.authorName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{post.authorBio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prev/Next Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {prevPost ? (
            <Link href={`/blog/${prevPost.slug}`} className="group">
              <Card className="h-full hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <ChevronLeft size={16} />
                    Previous Post
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {prevPost.title}
                  </h4>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <div />
          )}
          {nextPost && (
            <Link href={`/blog/${nextPost.slug}`} className="group">
              <Card className="h-full hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Next Post
                    <ChevronRight size={16} />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {nextPost.title}
                  </h4>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* More from Author */}
        {authorPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6">
              More from {post.authorName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {authorPosts.map((authorPost) => (
                <Link key={authorPost.id} href={`/blog/${authorPost.slug}`} className="group">
                  <Card className="h-full hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="relative h-32 overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
                      {authorPost.featuredImage ? (
                        <Image
                          src={authorPost.featuredImage}
                          alt={authorPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-serif font-bold text-gray-300 dark:text-gray-600">
                            {authorPost.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {authorPost.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatShortDate(authorPost.publishedAt)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section>
            <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6">
              Related Posts in {post.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className="group">
                  <Card className="h-full hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="relative h-32 overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
                      {relatedPost.featuredImage ? (
                        <Image
                          src={relatedPost.featuredImage}
                          alt={relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-serif font-bold text-gray-300 dark:text-gray-600">
                            {relatedPost.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatShortDate(relatedPost.publishedAt)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
