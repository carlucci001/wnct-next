'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, ArrowRight, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Event } from '@/types/event';
import { getUpcomingEvents } from '@/lib/events';
import { AdDisplay } from '../advertising/AdDisplay';

export function EventsSidebar() {
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const events = await getUpcomingEvents(5);
        setUpcoming(events);
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  return (
    <div className="space-y-8 sticky top-24">
      {/* Submit Event CTA */}
      <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <CardContent className="p-6 relative z-10">
          <PlusCircle className="h-10 w-10 mb-4 opacity-80" />
          <h3 className="text-xl font-bold mb-2 font-serif">Host an Event?</h3>
          <p className="text-sm opacity-90 mb-6 leading-relaxed">
            Reach thousands of local residents by listing your event in our community calendar.
          </p>
          <Button variant="secondary" className="w-full font-bold shadow-lg" asChild>
            <Link href="/events/submit">Submit Your Event</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Mini Calendar Placeholder */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center">
              <CalendarIcon size={18} className="mr-2 text-primary" />
              January 2026
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-4 pb-6">
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-muted-foreground font-bold">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {/* Simple month grid placeholder */}
            {Array.from({ length: 31 }).map((_, i) => (
              <div 
                key={i} 
                className={`py-2 rounded-md transition-colors ${
                  [5, 12, 18, 24].includes(i + 1) 
                    ? 'bg-primary/10 text-primary font-bold cursor-pointer hover:bg-primary/20 relative' 
                    : 'text-muted-foreground/60'
                }`}
              >
                {i + 1}
                {[5, 12, 18, 24].includes(i + 1) && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            Upcoming Events
          </h3>
          <Link href="/events" className="text-xs text-primary font-bold hover:underline flex items-center">
            View All <ArrowRight size={12} className="ml-1" />
          </Link>
        </div>
        
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No upcoming events found.</p>
          ) : (
            upcoming.map((event) => (
              <Link 
                key={event.id} 
                href={`/events/${event.slug}`}
                className="flex gap-4 group p-2 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
              >
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0 border border-border">
                  {event.featuredImage ? (
                    <Image 
                      src={event.featuredImage} 
                      alt={event.title} 
                      width={64}
                      height={64}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <CalendarIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="font-bold group-hover:text-primary transition-colors line-clamp-1 text-sm">
                    {event.title}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <CalendarIcon size={10} className="mr-1" />
                    {event.startDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                    <MapPin size={10} className="mr-1" />
                    <span className="line-clamp-1">{event.location.name}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Ad Spot */}
      <Card className="border-border/50 shadow-sm overflow-hidden p-0">
        <AdDisplay position="sidebar_top" className="w-full" />
      </Card>
    </div>
  );
}
