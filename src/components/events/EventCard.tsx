'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types/event';
import { formatEventDate, isFree } from '@/lib/events';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const free = isFree(event.price);

  return (
    <Link href={`/events/${event.slug}`} className="block group">
      <Card className="overflow-hidden h-full border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card">
        {/* Image Section */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {event.featuredImage ? (
            <img
              src={event.featuredImage}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Calendar size={48} className="text-muted-foreground/20" />
            </div>
          )}
          
          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none hover:bg-background/90">
              {event.category}
            </Badge>
            {event.featured && (
              <Badge className="bg-yellow-500 text-yellow-950 border-none">
                <Star size={12} className="mr-1 fill-current" />
                Featured
              </Badge>
            )}
            {free && (
              <Badge className="bg-green-600 text-white border-none">
                FREE
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="text-xl font-bold font-serif mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar size={14} className="mr-2 text-primary" />
              <span>{event.startDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            {!event.allDay && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock size={14} className="mr-2 text-primary" />
                <span>{event.startDate.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            )}
            
            <div className="flex items-start text-sm text-muted-foreground">
              <MapPin size={14} className="mr-2 mt-1 text-primary shrink-0" />
              <span className="line-clamp-1">{event.location.name}</span>
            </div>
          </div>
          
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 italic">
            {event.description}
          </p>
        </CardContent>

        <CardFooter className="px-4 py-3 border-t bg-muted/30 flex justify-between items-center mt-auto">
          <span className="text-sm font-bold text-primary">View Details</span>
          {event.price && !free && (
            <span className="text-sm font-semibold text-foreground">{event.price}</span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full border-border/50 animate-pulse">
      <div className="aspect-[16/9] bg-muted" />
      <CardContent className="p-4 space-y-3">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
        <div className="h-10 bg-muted rounded w-full mt-2" />
      </CardContent>
    </Card>
  );
}
