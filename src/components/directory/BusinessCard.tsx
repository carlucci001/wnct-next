'use client';

import Link from 'next/link';
import { MapPin, Phone, Clock, Star, BadgeCheck, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Business } from '@/types/business';
import { isBusinessOpen, getTodayHours } from '@/lib/directory';

interface BusinessCardProps {
  business: Business;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const isOpen = isBusinessOpen(business.hours);
  const todayHours = getTodayHours(business.hours);

  return (
    <Link href={`/directory/${business.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden">
        {/* Logo/Image */}
        <div className="relative h-40 bg-muted flex items-center justify-center overflow-hidden">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : business.images && business.images.length > 0 ? (
            <img
              src={business.images[0]}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-4xl font-bold text-muted-foreground/30">
              {business.name.charAt(0)}
            </div>
          )}

          {/* Featured Badge */}
          {business.featured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-950">
              <Star size={12} className="mr-1" fill="currentColor" />
              Featured
            </Badge>
          )}

          {/* Open/Closed Badge */}
          <Badge
            variant={isOpen ? 'default' : 'secondary'}
            className={`absolute top-2 right-2 ${
              isOpen ? 'bg-green-600 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-500'
            }`}
          >
            {isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Category */}
          <Badge variant="outline" className="mb-2 text-xs">
            {business.category}
          </Badge>

          {/* Name & Verified */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {business.name}
            </h3>
            {business.verified && (
              <BadgeCheck size={18} className="text-blue-500 shrink-0 mt-1" />
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {business.description}
          </p>

          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
            <MapPin size={14} className="shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              {business.address.street}, {business.address.city}
            </span>
          </div>

          {/* Hours */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock size={14} className="shrink-0" />
            <span>{todayHours}</span>
          </div>

          {/* Phone (mobile click-to-call) */}
          {business.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone size={14} className="shrink-0" />
              <a
                href={`tel:${business.phone}`}
                className="hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {business.phone}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Skeleton for loading state
export function BusinessCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <div className="h-40 bg-muted animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="h-5 bg-muted rounded animate-pulse w-20" />
        <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </CardContent>
    </Card>
  );
}
