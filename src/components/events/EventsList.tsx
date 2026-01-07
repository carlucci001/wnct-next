'use client';

import React from 'react';
import { EventCard, EventCardSkeleton } from './EventCard';
import { Event } from '@/types/event';
import { Calendar } from 'lucide-react';

interface EventsListProps {
  events: Event[];
  loading: boolean;
}

export function EventsList({ events, loading }: EventsListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
        <Calendar size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
        <h3 className="text-xl font-bold mb-2">No events found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search terms to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
