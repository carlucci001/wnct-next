'use client';

import React from 'react';
import { 
  Calendar, 
  Share2, 
  Eye, 
  Bookmark, 
  Facebook, 
  Twitter, 
  Link as LinkIcon,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/types/blogPost';
import { formatBlogDate } from '@/lib/blog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BlogPostDetailProps {
  post: BlogPost;
}

export function BlogPostDetail({ post }: BlogPostDetailProps) {
  const router = useRouter();

  const handleShare = (platform?: string) => {
    const url = window.location.href;
    const text = `Check out this blog post: ${post.title}`;

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <article className="max-w-none">
      {/* Header Info */}
      <div className="mb-10 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] px-3 py-1">
            {post.category}
          </Badge>
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {formatBlogDate(post.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Eye size={14} className="text-primary" /> {post.viewCount || 0} views</span>
            <span className="hidden md:flex items-center gap-1.5"><Clock size={14} className="text-primary" /> 5 min read</span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-serif font-black leading-[1.1] text-foreground tracking-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-6 py-8 border-y border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5">
              {post.authorPhoto ? (
                <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-black italic text-xl">
                  {post.authorName[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-0.5">Community Contributor</p>
              <h4 className="text-lg font-serif font-bold text-foreground leading-none">{post.authorName}</h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11 hover:bg-primary/10 hover:text-primary transition-all shadow-sm" onClick={() => handleShare('facebook')}>
              <Facebook size={18} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11 hover:bg-primary/10 hover:text-primary transition-all shadow-sm" onClick={() => handleShare('twitter')}>
              <Twitter size={18} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11 hover:bg-primary/10 hover:text-primary transition-all shadow-sm" onClick={() => handleShare()}>
              <LinkIcon size={18} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-11 w-11 hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
              <Bookmark size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="relative aspect-[21/9] rounded-[2rem] overflow-hidden mb-12 shadow-2xl border-4 border-background">
          <img 
            src={post.featuredImage} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Excerpt/Intro */}
      {post.excerpt && (
        <div className="mb-10 p-8 md:p-12 bg-muted/40 rounded-[2rem] border-l-8 border-primary relative overflow-hidden">
          <QuoteIcon className="absolute top-6 right-8 w-24 h-24 text-primary/5 -rotate-12" />
          <p className="text-2xl md:text-3xl font-serif font-black italic text-foreground/80 leading-snug relative z-10">
            &ldquo;{post.excerpt}&rdquo;
          </p>
        </div>
      )}

      {/* Main Content */}
      <div 
        className="prose prose-lg prose-slate dark:prose-invert max-w-none 
          prose-headings:font-serif prose-headings:font-black prose-headings:tracking-tight
          prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300
          prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl
          prose-img:rounded-3xl shadow-sm prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
        "
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Footer Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-16 pt-8 border-t border-border/50">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mr-2">Tagged:</span>
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="rounded-full px-4 py-1.5 text-xs font-bold bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Navigation and Reactions */}
      <div className="mt-16 bg-card rounded-3xl border border-border/50 p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="flex -space-x-3 overflow-hidden">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex h-10 w-10 rounded-full ring-4 ring-card bg-primary/20 items-center justify-center text-[10px] font-bold">
              +1
            </div>
          ))}
          <div className="flex items-center pl-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
            12 Community Reactions
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button variant="ghost" className="rounded-full font-black text-xs uppercase tracking-widest" onClick={() => router.back()}>
            <ArrowLeft className="mr-2" size={16} /> Previous Post
          </Button>
          <Button className="rounded-full font-black text-xs uppercase tracking-widest shadow-lg">
            Share Opinion <Share2 className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C15.4647 8 15.017 8.44772 15.017 9V12C15.017 12.5523 14.5693 13 14.017 13H12.017V21H14.017ZM5.017 21L5.017 18C5.017 16.8954 5.91242 16 7.017 16H10.017C10.5693 16 11.017 15.5523 11.017 15V9C11.017 8.44772 10.5693 8 10.017 8H7.017C6.46472 8 6.017 8.44772 6.017 9V12C6.017 12.5523 5.5693 13 5.017 13H3.017V21H5.017Z" />
    </svg>
  );
}
