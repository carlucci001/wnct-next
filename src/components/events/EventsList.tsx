"use client";

import { useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCard } from './EventCard';
import { Event } from '@/types/event';

interface EventsListProps {
  events: Event[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  emptyMessage?: string;
}

export function EventsList({
  events,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  emptyMessage = "No events found",
}: EventsListProps) {
  if (loading) {
    return <EventsListSkeleton count={4} />;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <Calendar className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Check back soon for upcoming events in your area.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}

      {hasMore && onLoadMore && (
        <Button
          variant="outline"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full py-6 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {loadingMore ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Loading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Load More Events
              <ChevronDown className="w-4 h-4" />
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

// Loading skeleton
function EventsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Date block skeleton */}
          <div className="hidden sm:flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 px-4 py-3 min-w-[80px]">
            <Skeleton className="w-8 h-3 mb-1" />
            <Skeleton className="w-6 h-7" />
          </div>

          {/* Image skeleton */}
          <div className="relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0">
            <Skeleton className="absolute inset-0" />
          </div>

          {/* Content skeleton */}
          <div className="flex-grow p-4">
            <div className="flex gap-2 mb-3">
              <Skeleton className="w-16 h-5 rounded-full" />
              <Skeleton className="w-12 h-5 rounded-full" />
            </div>
            <Skeleton className="w-3/4 h-6 mb-2" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="w-24 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="w-32 h-4" />
              </div>
            </div>
            <Skeleton className="w-full h-10 mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { EventsListSkeleton };
