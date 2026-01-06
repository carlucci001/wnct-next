"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  ExternalLink,
  Share2,
  CalendarPlus,
  Ticket,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Event } from '@/types/event';
import {
  getEventBySlug,
  getUpcomingEvents,
  formatEventDate,
  formatEventTimeRange,
  isEventFree,
  getEventMapUrl,
  getGoogleCalendarUrl,
} from '@/lib/events';
import { EventCardCompact } from '@/components/events/EventCard';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug]);

  const loadEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventData = await getEventBySlug(slug);
      if (!eventData) {
        setError('Event not found');
        return;
      }
      setEvent(eventData);

      // Load related events (same category, excluding current)
      const upcoming = await getUpcomingEvents(6);
      const related = upcoming.filter(
        (e) => e.id !== eventData.id && e.category === eventData.category
      );
      setRelatedEvents(related.slice(0, 3));
    } catch (err) {
      console.error('Error loading event:', err);
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = event?.title || 'Event';

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleAddToCalendar = () => {
    if (event) {
      window.open(getGoogleCalendarUrl(event), '_blank');
    }
  };

  if (loading) {
    return <EventDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {error || 'Event not found'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          The event you are looking for may have been removed or does not exist.
        </p>
        <Button onClick={() => router.push('/events')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  const isFree = isEventFree(event.price);
  const eventDate = event.startDate?.toDate?.() || new Date();
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      {/* Back Link */}
      <Link
        href="/events"
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Events
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN: Event Details */}
        <div className="lg:w-2/3 w-full">
          {/* Hero Image */}
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6">
            {event.featuredImage ? (
              <Image
                src={event.featuredImage}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-20 h-20 text-white/80" />
              </div>
            )}
            {/* Category Badge Overlay */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white">
                {event.category}
              </Badge>
            </div>
            {event.featured && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-500 text-white">Featured</Badge>
              </div>
            )}
          </div>

          {/* Title and Badges */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {isFree && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                >
                  Free Event
                </Badge>
              )}
              {event.status === 'cancelled' && (
                <Badge variant="destructive">Cancelled</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              {event.title}
            </h1>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formattedDate}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatEventTimeRange(event.startDate, event.endDate, event.allDay)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {event.location.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {event.location.address}, {event.location.city}
                </p>
                <a
                  href={getEventMapUrl(event.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center mt-1"
                >
                  Get Directions
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              About This Event
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {event.content || event.description}
              </p>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Organizer
            </h2>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {event.organizer.name}
                </p>
              </div>
              <div className="space-y-2">
                {event.organizer.email && (
                  <a
                    href={`mailto:${event.organizer.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Mail className="w-4 h-4" />
                    {event.organizer.email}
                  </a>
                )}
                {event.organizer.phone && (
                  <a
                    href={`tel:${event.organizer.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Phone className="w-4 h-4" />
                    {event.organizer.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions & Related */}
        <div className="lg:w-1/3 w-full lg:sticky lg:top-24 space-y-6">
          {/* Action Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6 space-y-4">
              {/* Price */}
              <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {isFree ? 'Admission' : 'Price'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isFree ? 'Free' : event.price}
                </p>
              </div>

              {/* Ticket Button */}
              {event.ticketUrl && (
                <Button
                  className="w-full"
                  onClick={() => window.open(event.ticketUrl, '_blank')}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  {isFree ? 'RSVP / Register' : 'Get Tickets'}
                </Button>
              )}

              {/* Add to Calendar */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddToCalendar}
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>

              {/* Share */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {shareSuccess ? 'Link Copied!' : 'Share Event'}
              </Button>
            </CardContent>
          </Card>

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  More {event.category} Events
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {relatedEvents.map((relatedEvent) => (
                  <EventCardCompact key={relatedEvent.id} event={relatedEvent} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function EventDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      <Skeleton className="w-32 h-5 mb-6" />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="lg:w-2/3 w-full">
          <Skeleton className="w-full h-64 md:h-96 rounded-lg mb-6" />

          <div className="mb-6">
            <div className="flex gap-2 mb-3">
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
            <Skeleton className="w-3/4 h-10 mb-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>

          <div className="mb-8">
            <Skeleton className="w-40 h-6 mb-4" />
            <Skeleton className="w-full h-32" />
          </div>

          <div>
            <Skeleton className="w-32 h-6 mb-4" />
            <Skeleton className="w-full h-24 rounded-lg" />
          </div>
        </div>

        <div className="lg:w-1/3 w-full lg:sticky lg:top-24 space-y-6">
          <Card className="border-gray-200 dark:border-gray-700">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="w-20 h-4 mx-auto mb-2" />
                <Skeleton className="w-16 h-8 mx-auto" />
              </div>
              <Skeleton className="w-full h-10 rounded-md" />
              <Skeleton className="w-full h-10 rounded-md" />
              <Skeleton className="w-full h-10 rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
