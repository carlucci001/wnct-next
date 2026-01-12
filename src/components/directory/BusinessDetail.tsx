"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Share2,
  BadgeCheck,
  Star,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { AdDisplay } from '../advertising/AdDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Business } from '@/types/business';
import { getTodayHours, getGoogleMapsUrl, isBusinessOpen, getActiveBusinesses } from '@/lib/directory';
import { DirectoryMap } from './DirectoryMap';

interface BusinessDetailProps {
  business: Business;
  relatedBusinesses?: Business[];
}

export function BusinessDetail({ business, relatedBusinesses = [] }: BusinessDetailProps) {
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const isOpen = isBusinessOpen(business.hours);
  const todayHours = getTodayHours(business.hours);
  const mapsUrl = getGoogleMapsUrl(business.address);

  useEffect(() => {
    async function loadAll() {
      try {
        const businesses = await getActiveBusinesses();
        setAllBusinesses(businesses);
      } catch (error) {
        console.error('Error loading businesses for map:', error);
      }
    }
    loadAll();
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: business.description,
          url: window.location.href,
        });
      } catch {
        // Share cancelled or failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="lg:w-2/3">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 bg-muted rounded-lg overflow-hidden mb-6">
          {business.images && business.images.length > 0 ? (
            <Image
              src={business.images[0]}
              alt={business.name}
              width={800}
              height={400}
              className="w-full h-full object-cover"
              priority
            />
          ) : business.logo ? (
            <Image
              src={business.logo}
              alt={business.name}
              width={200}
              height={200}
              className="w-full h-full object-contain p-8"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-muted-foreground/30">
              {business.name.charAt(0)}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {business.featured && (
              <Badge className="bg-yellow-500 text-yellow-950 shadow-sm border-none">
                <Star size={12} className="mr-1" fill="currentColor" />
                Featured
              </Badge>
            )}
            <Badge 
              variant={isOpen ? 'default' : 'secondary'}
              className={isOpen ? 'bg-green-600 hover:bg-green-600 border-none' : ''}
            >
              {isOpen ? 'Open Now' : 'Closed'}
            </Badge>
          </div>
        </div>

        {/* Business Info */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <Badge variant="outline" className="mb-2">
                {business.category}
              </Badge>
              <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
                {business.name}
                {business.verified && (
                  <BadgeCheck size={24} className="text-blue-500" />
                )}
              </h1>
            </div>
            <Button variant="outline" size="icon" onClick={handleShare} title="Share Business">
              <Share2 size={18} />
            </Button>
          </div>

          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{business.description}</p>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Address */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-5 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
            >
              <div className="bg-primary/10 p-2 rounded-lg">
                <MapPin className="text-primary" size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Address</p>
                <div className="text-sm text-muted-foreground mt-0.5">
                  <p>{business.address.street}</p>
                  <p>{business.address.city}, {business.address.state} {business.address.zip}</p>
                </div>
                <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
                  Get Directions <ExternalLink size={10} />
                </p>
              </div>
            </a>

            {/* Hours */}
            <div className="flex items-start gap-4 p-5 bg-muted/30 rounded-xl border border-transparent">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Clock className="text-primary" size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Today&apos;s Hours</p>
                <p className="text-sm text-muted-foreground mt-0.5 font-medium">{todayHours}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {isOpen ? 'Currently Open' : 'Currently Closed'}
                </p>
              </div>
            </div>

            {/* Phone */}
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-4 p-5 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
              >
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Phone className="text-primary" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Phone</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{business.phone}</p>
                </div>
              </a>
            )}

            {/* Website */}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
              >
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Globe className="text-primary" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Website</p>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                    Visit Website <ExternalLink size={12} />
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Photo Gallery */}
        {business.images && business.images.length > 1 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Photo Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {business.images.slice(1).map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted group cursor-pointer border border-border">
                  <Image
                    src={img}
                    alt={`${business.name} photo ${i + 2}`}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="lg:w-1/3 space-y-6">
        {/* 1. Map Module - Top Right (Sidebar Top) */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Explore Local
          </h3>
          <DirectoryMap businesses={allBusinesses} className="shadow-lg border-primary/10 hover:border-primary/30 transition-colors" />
        </div>

        {/* Full Hours Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Complete Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {business.hours ? Object.entries(business.hours).map(([day, time]) => (
                <div key={day} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                  <span className="capitalize font-medium text-muted-foreground">{day}</span>
                  <span className={time.toLowerCase() === 'closed' ? 'text-red-500 font-bold' : 'text-foreground'}>
                    {time}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic">Hours not specified</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Claim Listing Card */}
        {!business.verified && (
          <Card className="bg-primary/5 border-primary/20 shadow-none border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <ShieldCheck size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Unverified Listing</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    Is this your business? Claim it to manage photos, update hours, and reply to customers.
                  </p>
                </div>
              </div>
              <Button size="sm" className="w-full font-bold">
                Claim this Listing
              </Button>
            </CardContent>
          </Card>
        )}

        {/* More from Category */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            More {business.category}
          </h3>
          <div className="space-y-3">
            {relatedBusinesses.length > 0 ? (
              relatedBusinesses.slice(0, 3).map((related) => (
                <Link
                  key={related.id}
                  href={`/directory/${related.slug}`}
                  className="flex gap-3 group p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="w-14 h-14 bg-muted rounded-md overflow-hidden shrink-0 border border-border">
                    {related.logo ? (
                      <Image 
                        src={related.logo} 
                        alt="" 
                        width={56} 
                        height={56} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-black text-lg">
                        {related.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {related.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Star size={10} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                        {related.address.city}, NC
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic px-1">None found in this category.</p>
            )}
          </div>
        </div>

        {/* Ad Spot & Sticky Behavior */}
        <div className="sticky top-24 space-y-6">
          <AdDisplay position="sidebar_sticky" />
        </div>
      </div>
    </div>
  );
}
