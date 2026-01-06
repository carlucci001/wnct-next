'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Share2,
  BadgeCheck,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Business } from '@/types/business';
import { getTodayHours, getGoogleMapsUrl, isBusinessOpen } from '@/lib/directory';

interface BusinessDetailProps {
  business: Business;
  relatedBusinesses?: Business[];
}

export function BusinessDetail({ business, relatedBusinesses = [] }: BusinessDetailProps) {
  const isOpen = isBusinessOpen(business.hours);
  const todayHours = getTodayHours(business.hours);
  const mapsUrl = getGoogleMapsUrl(business.address);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: business.description,
          url: window.location.href,
        });
      } catch (_error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="lg:w-2/3">
        {/* Hero Image */}
        <div className="relative h-64 md:h-80 bg-muted rounded-lg overflow-hidden mb-6">
          {business.images && business.images.length > 0 ? (
            <img
              src={business.images[0]}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
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
              <Badge className="bg-yellow-500 text-yellow-950 shadow-sm">
                <Star size={12} className="mr-1" fill="currentColor" />
                Featured
              </Badge>
            )}
            <Badge 
              variant={isOpen ? 'default' : 'secondary'}
              className={isOpen ? 'bg-green-600 hover:bg-green-600 shadow-sm' : 'shadow-sm'}
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
                  <img
                    src={img}
                    alt={`${business.name} photo ${i + 2}`}
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
        {/* Full Hours Card */}
        {business.hours && (
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Full Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2.5">
                {dayNames.map((day, i) => {
                  const hoursKey = day.toLowerCase() as keyof typeof business.hours;
                  const hoursValue = (business.hours as any)?.[hoursKey];
                  const isToday = i === today;
                  return (
                    <li
                      key={day}
                      className={`flex justify-between text-sm py-1 border-b border-muted/50 last:border-0 ${
                        isToday ? 'font-bold text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        {day}
                      </span>
                      <span>{hoursValue || 'Closed'}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Claim Listing Card */}
        {!business.ownerId && (
          <Card className="bg-primary/5 border-primary/20 shadow-sm">
            <CardContent className="pt-6 text-center">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="text-primary" size={24} />
              </div>
              <h3 className="font-bold text-foreground mb-2">Claim This Listing</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you the owner of {business.name}? Claim this listing to manage your information and connect with customers.
              </p>
              <Button className="w-full font-bold">
                Claim Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* More from Category */}
        {relatedBusinesses.length > 0 && (
          <div className="pt-2">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star size={18} className="text-primary" />
              Similar in {business.category}
            </h2>
            <div className="space-y-4">
              {relatedBusinesses.map((b) => (
                <Link
                  key={b.id}
                  href={`/directory/${b.slug}`}
                  className="flex gap-4 group p-2 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 font-black text-xl">
                        {b.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="font-bold group-hover:text-primary transition-colors line-clamp-1 text-sm">
                      {b.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {b.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
