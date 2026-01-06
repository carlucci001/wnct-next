"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Tag, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCardCompact } from './EventCard';
import { Event } from '@/types/event';
import { DEFAULT_EVENT_CATEGORIES } from '@/types/event';

interface EventsSidebarProps {
  upcomingEvents: Event[];
  categories?: string[];
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
  loading?: boolean;
  eventsForCalendar?: Event[];
}

export function EventsSidebar({
  upcomingEvents,
  categories = DEFAULT_EVENT_CATEGORIES,
  selectedCategory,
  onCategorySelect,
  loading = false,
  eventsForCalendar = [],
}: EventsSidebarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Get event dates for the current month
  const eventDates = useMemo(() => {
    const dates = new Set<number>();
    eventsForCalendar.forEach((event) => {
      const eventDate = event.startDate?.toDate?.();
      if (
        eventDate &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      ) {
        dates.add(eventDate.getDate());
      }
    });
    return dates;
  }, [eventsForCalendar, month, year]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  if (loading) {
    return <EventsSidebarSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Mini Calendar */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {monthName}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={goToPrevMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={goToNextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
              >
                {day}
              </div>
            ))}
            {/* Empty cells for days before first of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="py-1" />
            ))}
            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasEvent = eventDates.has(day);
              const isTodayDay = isToday(day);

              return (
                <div
                  key={day}
                  className={`
                    relative py-1 text-sm rounded cursor-pointer
                    transition-colors
                    ${isTodayDay
                      ? 'bg-blue-600 text-white font-bold'
                      : hasEvent
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {day}
                  {hasEvent && !isTodayDay && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {upcomingEvents.length > 0 ? (
            <div className="space-y-1">
              {upcomingEvents.slice(0, 5).map((event) => (
                <EventCardCompact key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No upcoming events
            </p>
          )}
          {upcomingEvents.length > 5 && (
            <Link
              href="/events"
              className="flex items-center justify-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              View all events
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Category Quick Links */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCategorySelect?.('all')}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full transition-colors
                ${(!selectedCategory || selectedCategory === 'all')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              All
            </button>
            {categories.slice(0, 8).map((category) => (
              <button
                key={category}
                onClick={() => onCategorySelect?.(category)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-full transition-colors
                  ${selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton
function EventsSidebarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Calendar skeleton */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="w-32 h-5" />
            <div className="flex gap-1">
              <Skeleton className="w-7 h-7 rounded" />
              <Skeleton className="w-7 h-7 rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-7" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events skeleton */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <Skeleton className="w-32 h-5" />
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-grow space-y-1">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-2/3 h-3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Categories skeleton */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <Skeleton className="w-24 h-5" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="w-16 h-7 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { EventsSidebarSkeleton };
