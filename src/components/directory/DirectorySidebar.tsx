'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, TrendingUp, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Business, DEFAULT_BUSINESS_CATEGORIES, DEFAULT_AREAS } from '@/types/business';
import { getFeaturedBusinesses } from '@/lib/directory';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const businesses = await getFeaturedBusinesses(4);
        setFeaturedBusinesses(businesses);
      } catch (error) {
        console.error('Error loading featured businesses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="space-y-6">
      {/* Featured Businesses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star size={16} className="text-yellow-500" />
            Featured Businesses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded" />
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
                className="flex gap-3 group"
              >
                <div className="w-12 h-12 bg-muted rounded overflow-hidden shrink-0">
                  {business.logo ? (
                    <img
                      src={business.logo}
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                      {business.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {business.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {business.category}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No featured businesses yet</p>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={16} />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onCategoryChange('all')}
            >
              All
            </Badge>
            {DEFAULT_BUSINESS_CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Areas */}
      {onAreaChange && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin size={16} />
              Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedArea === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onAreaChange('all')}
              >
                All Areas
              </Badge>
              {DEFAULT_AREAS.slice(0, 6).map((area) => (
                <Badge
                  key={area}
                  variant={selectedArea === area ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => onAreaChange(area)}
                >
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Your Business CTA */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center">
          <h3 className="font-semibold mb-2">Own a local business?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get listed in our directory and reach local customers.
          </p>
          <Button size="sm" className="w-full">
            Add Your Business
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
