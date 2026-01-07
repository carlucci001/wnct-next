'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventDetail } from '@/components/events/EventDetail';
import { getEventBySlug, getEvents } from '@/lib/events';
import { Event } from '@/types/event';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [related, setRelated] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await getEventBySlug(slug);
        if (data) {
          setEvent(data);
          // Load related events in same category
          const allEvents = await getEvents({ status: 'published', category: data.category });
          setRelated(allEvents.filter(e => e.id !== data.id).slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-muted rounded w-32" />
          <div className="aspect-[21/9] bg-muted rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
          </div>
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen text-center">
        <div className="bg-muted/10 p-12 rounded-3xl border shadow-sm">
          <Calendar size={64} className="mx-auto mb-6 text-muted-foreground opacity-20" />
          <h1 className="text-3xl font-serif font-black mb-4">Event Not Found</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-sm mx-auto">
            The event you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Button className="rounded-full px-8 h-11 font-bold" onClick={() => router.push('/events')}>
            Back to Calendar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-screen">
      {/* Navigation */}
      <nav className="mb-8">
        <Button 
          variant="ghost" 
          className="rounded-full px-4 text-muted-foreground hover:text-primary transition-colors h-10 group" 
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </Button>
      </nav>

      <EventDetail event={event} relatedEvents={related} />
    </div>
  );
}
