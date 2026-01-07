'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  TrendingUp, 
  Tag as TagIcon, 
  Mail, 
  User,
  Quote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/types/blogPost';
import { getBlogPosts, formatBlogDate } from '@/lib/blog';

export function BlogSidebar({ author }: { author?: Partial<BlogPost> }) {
  const [recent, setRecent] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      try {
        const posts = await getBlogPosts({ status: 'published', limit: 4 });
        setRecent(posts);
      } catch (error) {
        console.error('Error fetching recent blog posts:', error);
      } finally {
        setLoading(false);
      }
    }
    loadRecent();
  }, []);

  return (
    <div className="space-y-10 sticky top-24">
      {/* Search Widget */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Search size={14} className="text-primary" />
            Search Blog
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search opinions, news..." 
              className="pl-9 h-11 bg-muted/30 border-none rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Author Bio (if viewing a post) */}
      {author && (
        <Card className="border-border/50 shadow-sm overflow-hidden bg-primary/5">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-primary" />
              About The Author
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-4 border-background shadow-lg overflow-hidden mb-4">
                {author.authorPhoto ? (
                  <img src={author.authorPhoto} alt={author.authorName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-black italic">
                    {author.authorName?.[0]}
                  </div>
                )}
              </div>
              <h4 className="text-xl font-serif font-black mb-2">{author.authorName}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-4">
                {author.authorBio || "Bringing you unique perspectives and community voices from across Western North Carolina."}
              </p>
              <div className="mt-6 w-full pt-6 border-t border-primary/10">
                <Button variant="outline" className="w-full rounded-full font-bold text-xs uppercase" size="sm">
                  View Author Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Newsletter Signup */}
      <Card className="bg-slate-950 text-white border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl" />
        <CardContent className="p-8 relative z-10 text-center">
          <Mail className="h-10 w-10 mb-4 mx-auto text-primary opacity-80" />
          <h3 className="text-xl font-bold mb-2 font-serif">Community Voice</h3>
          <p className="text-sm opacity-80 mb-6 leading-relaxed">
            Get the best local opinion pieces and feature stories delivered to your inbox every week.
          </p>
          <div className="space-y-3">
            <Input className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11 text-center" placeholder="your@email.com" />
            <Button className="w-full h-11 font-bold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground border-none">
              Subscribe Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-serif font-black text-lg flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Recent Posts
          </h3>
        </div>
        
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-20 h-20 bg-muted rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : recent.map((post) => (
            <Link 
              key={post.id} 
              href={`/blog/${post.slug}`}
              className="flex gap-4 group items-center p-2 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
            >
              <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden shrink-0 border border-border">
                {post.featuredImage ? (
                  <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-serif italic font-black text-xl">WNC</div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold group-hover:text-primary transition-colors line-clamp-2 text-sm leading-tight mb-1 font-serif">
                  {post.title}
                </h4>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-2">
                  <span>{formatBlogDate(post.createdAt)}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tags Cloud */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <TagIcon size={14} className="text-primary" />
            Popular Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {['Asheville', 'Sustainability', 'Local Business', 'Art Scene', 'Hike WNC', 'Education', 'Politics', 'Foodie'].map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full px-3 py-1 cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-[10px] font-bold uppercase tracking-wider">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Featured Quote */}
      <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 relative overflow-hidden group">
        <Quote className="absolute -top-4 -left-4 w-24 h-24 text-primary/10 -rotate-12 transition-transform duration-500 group-hover:scale-110" />
        <p className="text-lg font-serif font-bold relative z-10 leading-relaxed italic text-foreground/80">
          "The voice of the community is the heart of a city. Without it, we are just a collection of buildings."
        </p>
        <div className="mt-6 flex items-center gap-3 relative z-10">
          <div className="h-0.5 w-6 bg-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Local Perspective</span>
        </div>
      </div>
    </div>
  );
}
