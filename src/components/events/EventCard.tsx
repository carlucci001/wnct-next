"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types/event';
import { formatEventDate, formatEventTimeRange, isEventFree } from '@/lib/events';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const isFree = isEventFree(event.price);
  const eventDate = event.startDate?.toDate?.() || new Date();
  const dayOfMonth = eventDate.getDate();
  const monthAbbr = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col sm:flex-row">
          {/* Date Block */}
          <div className="hidden sm:flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 px-4 py-3 min-w-[80px]">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
              {monthAbbr}
            </span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {dayOfMonth}
            </span>
          </div>

          {/* Image */}
          <div className="relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0">
            {event.featuredImage ? (
              <Image
                src={event.featuredImage}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-white/80" />
              </div>
            )}
            {/* Mobile date overlay */}
            <div className="sm:hidden absolute top-2 left-2 bg-white dark:bg-gray-800 rounded px-2 py-1 shadow">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {monthAbbr} {dayOfMonth}
              </span>
            </div>
          </div>

          {/* Content */}
          <CardContent className="flex-grow p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              >
                {event.category}
              </Badge>
              {isFree && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                >
                  Free
                </Badge>
              )}
              {event.featured && (
                <Badge
                  variant="default"
                  className="text-xs bg-amber-500 text-white"
                >
                  Featured
                </Badge>
              )}
            </div>

            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
              {event.title}
            </h3>

            <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{formatEventTimeRange(event.startDate, event.endDate, event.allDay)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{event.location.name}, {event.location.city}</span>
              </div>
            </div>

            {event.description && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {event.description}
              </p>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

// Compact variant for sidebar
export function EventCardCompact({ event }: EventCardProps) {
  const eventDate = event.startDate?.toDate?.() || new Date();
  const dayOfMonth = eventDate.getDate();
  const monthAbbr = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900 rounded px-2 py-1 min-w-[45px]">
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase">
          {monthAbbr}
        </span>
        <span className="text-lg font-bold text-blue-700 dark:text-blue-200">
          {dayOfMonth}
        </span>
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
          {event.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {event.location.name}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatEventTimeRange(event.startDate, event.endDate, event.allDay)}
        </p>
      </div>
    </Link>
  );
}
