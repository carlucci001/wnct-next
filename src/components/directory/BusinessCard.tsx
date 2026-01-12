'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { MapPin, Phone, Clock, Star, BadgeCheck } from 'lucide-react';
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
      <Card className="h-full overflow-hidden border-border/40 bg-card hover:bg-accent/5 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.05)] cursor-pointer group flex flex-col">
        {/* Image Container */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {business.images && business.images.length > 0 ? (
            <NextImage
              src={business.images[0]}
              alt={business.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : business.logo ? (
            <NextImage
              src={business.logo}
              alt={business.name}
              fill
              className="object-contain p-8 opacity-80"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl font-serif font-bold text-muted-foreground/20 bg-linear-to-br from-muted/50 to-muted">
              {business.name.charAt(0)}
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Featured Badge */}
          {business.featured && (
            <Badge className="absolute top-3 left-3 bg-yellow-500 hover:bg-yellow-500 text-yellow-950 font-bold shadow-sm">
              <Star size={12} className="mr-1 fill-yellow-950" />
              Featured
            </Badge>
          )}

          {/* Open/Closed Badge */}
          <Badge
            variant={isOpen ? 'default' : 'secondary'}
            className={`absolute top-3 right-3 backdrop-blur-md ${
              isOpen ? 'bg-green-600/90 text-white' : 'bg-gray-500/90 text-white'
            }`}
          >
            {isOpen ? 'Open Now' : 'Closed'}
          </Badge>
        </div>

        <CardContent className="p-5 flex flex-col grow">
          {/* Category */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
              {business.category}
            </span>
            {business.verified && (
              <BadgeCheck size={14} className="text-blue-500" />
            )}
          </div>

          {/* Name */}
          <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {business.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 grow leading-relaxed">
            {business.description}
          </p>

          {/* Details */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <MapPin size={14} className="shrink-0 text-primary/60 mt-0.5" />
              <span className="line-clamp-1">
                {business.address.street}, {business.address.city}, {business.address.state}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Clock size={14} className="shrink-0 text-primary/60" />
              <span>{todayHours}</span>
            </div>

            {business.phone && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <Phone size={14} className="shrink-0 text-primary/60" />
                <span className="group-hover:text-primary transition-colors">
                  {business.phone}
                </span>
              </div>
            )}
          </div>
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
