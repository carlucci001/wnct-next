'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, TrendingUp, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Business, DEFAULT_BUSINESS_CATEGORIES, DEFAULT_AREAS } from '@/types/business';
import { getFeaturedBusinesses, getActiveBusinesses } from '@/lib/directory';
import { AdDisplay } from '../advertising/AdDisplay';
import Image from 'next/image';
import { DirectoryMap } from './DirectoryMap';

interface DirectorySidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedArea?: string;
  onAreaChange?: (area: string) => void;
}

export function DirectorySidebar({
  selectedCategory,
  onCategoryChange,
  selectedArea,
  onAreaChange,
}: DirectorySidebarProps) {
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featured, all] = await Promise.all([
          getFeaturedBusinesses(4),
          getActiveBusinesses(selectedCategory !== 'all' ? selectedCategory : undefined)
        ]);
        setFeaturedBusinesses(featured);
        setAllBusinesses(all);
      } catch (error) {
        console.error('Error loading businesses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategory]);

  return (
    <div className="space-y-8">
      {/* 1. Map Module - Top Right (Sidebar Top) */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Explore Local
        </h3>
        <DirectoryMap businesses={allBusinesses} className="shadow-lg border-primary/10 hover:border-primary/30 transition-colors" />
      </div>

      {/* 2. Featured Businesses */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Top Rated
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-3">
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse p-2">
                  <div className="w-16 h-16 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : featuredBusinesses.length > 0 ? (
              featuredBusinesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/directory/${business.slug}`}
                  className="flex gap-4 group p-2 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                    {business.logo ? (
                      <Image 
                        src={business.logo} 
                        alt={business.name} 
                        width={64}
                        height={64}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 font-black text-xl">
                        {business.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="font-bold group-hover:text-primary transition-colors line-clamp-1 text-sm">
                      {business.name}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-medium">4.9</span>
                      <span className="text-xs text-muted-foreground ml-1 line-clamp-1">{business.category}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4 italic">
                No featured businesses found.
              </p>
            )}
          </div>
          
          <Button variant="ghost" className="w-full mt-4 text-xs font-bold text-primary hover:text-primary hover:bg-primary/5 uppercase tracking-widest" asChild>
            <Link href="/directory">View All Listings</Link>
          </Button>
        </CardContent>
      </Card>

      {/* 3. Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Browse Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'secondary'}
            className="cursor-pointer py-1.5 px-3 transition-all hover:scale-105 active:scale-95"
            onClick={() => onCategoryChange('all')}
          >
            All
          </Badge>
          {DEFAULT_BUSINESS_CATEGORIES.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'secondary'}
              className="cursor-pointer py-1.5 px-3 transition-all hover:scale-105 active:scale-95"
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Ad Spot */}
      <AdDisplay position="sidebar_top" className="rounded-xl overflow-hidden shadow-sm" />

      {/* 4. Neighborhoods */}
      {onAreaChange && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Neighborhoods
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_AREAS.map((area) => (
              <Button
                key={area}
                variant="outline"
                size="sm"
                onClick={() => onAreaChange(area)}
                className={`justify-start text-xs rounded-lg h-9 px-3 border-border/50 hover:border-primary/50 transition-all ${
                  selectedArea === area ? 'bg-primary/10 border-primary/50 text-primary font-bold' : ''
                }`}
              >
                <MapPin size={12} className="mr-2 opacity-50 shrink-0" />
                <span className="truncate">{area}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Sticky Content (Bottom) */}
      <div className="sticky top-24 space-y-6">
        <Card className="bg-primary/5 border-primary/20 shadow-none">
          <CardContent className="pt-6 text-center">
            <h3 className="font-bold text-sm mb-2">Own a local business?</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Get listed in our premium directory and reach thousands of local residents.
            </p>
            <Button size="sm" className="w-full font-bold">
              Add Your Business
            </Button>
          </CardContent>
        </Card>
        
        <AdDisplay position="sidebar_sticky" />
      </div>
    </div>
  );
}
