'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  MapPin, 
  Share2, 
  User, 
  Ticket, 
  ExternalLink,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/types/event';
import { formatEventDate, isFree } from '@/lib/events';

interface EventDetailProps {
  event: Event;
  relatedEvents?: Event[];
}

export function EventDetail({ event, relatedEvents = [] }: EventDetailProps) {
  const free = isFree(event.price);
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const addToCalendar = () => {
    const start = event.startDate.toDate().toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = event.endDate 
      ? event.endDate.toDate().toISOString().replace(/-|:|\.\d\d\d/g, "")
      : event.startDate.toDate().toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location.name + ', ' + event.location.address)}&sf=true&output=xml`;
    
    window.open(googleUrl, '_blank');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Content */}
      <div className="lg:w-2/3">
        {/* Hero Section */}
        <div className="relative aspect-21/9 md:aspect-24/9 rounded-2xl overflow-hidden mb-8 shadow-xl">
          {event.featuredImage ? (
            <Image
              src={event.featuredImage}
              alt={event.title}
              width={1200}
              height={500}
              className="w-full h-full object-cover"
              style={{ width: '100%', height: 'auto' }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Calendar size={64} className="text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
            <Badge className="bg-primary text-primary-foreground mb-4 border-none px-4 py-1">
              {event.category}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-serif font-black text-white leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Content Tabs/Sections */}
        <div className="space-y-10">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-6 bg-muted/30 rounded-2xl border border-transparent shadow-sm">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Calendar className="text-primary" size={24} />
              </div>
              <div>
                <p className="font-bold text-foreground">Date & Time</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatEventDate(event.startDate, event.allDay)}
                </p>
                {event.endDate && (
                  <p className="text-sm text-muted-foreground">
                    Ends: {formatEventDate(event.endDate, event.allDay)}
                  </p>
                )}
                <Button 
                  variant="link" 
                  className="px-0 h-auto text-primary text-xs font-bold mt-2"
                  onClick={addToCalendar}
                >
                  <Plus size={12} className="mr-1" /> Add to Calendar
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-muted/30 rounded-2xl border border-transparent shadow-sm">
              <div className="bg-primary/10 p-3 rounded-xl">
                <MapPin className="text-primary" size={24} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Today&apos;s Hours</p>
                <p className="text-sm text-muted-foreground mt-1">{event.location.name}</p>
                <p className="text-sm text-muted-foreground">{event.location.address}, {event.location.city}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location.name + ' ' + event.location.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs font-bold mt-2 flex items-center hover:underline"
                >
                  View on Map <ExternalLink size={10} className="ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card rounded-2xl border p-8">
            <h2 className="text-2xl font-bold mb-6 font-serif">About This Event</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
              {event.content && (
                <div className="mt-6" dangerouslySetInnerHTML={{ __html: event.content }} />
              )}
            </div>
          </div>

          {/* Organizer Info */}
          <div className="bg-muted/30 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <User size={32} className="text-primary" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Organized By</p>
              <h3 className="text-2xl font-bold font-serif">{event.organizer.name}</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                {event.organizer.email && (
                  <a href={`mailto:${event.organizer.email}`} className="text-sm text-primary hover:underline font-medium">
                    {event.organizer.email}
                  </a>
                )}
                {event.organizer.phone && (
                  <span className="text-sm text-muted-foreground font-medium">
                    {event.organizer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="lg:w-1/3 space-y-6">
        {/* Tickets/Status Card */}
        <Card className="shadow-xl border-primary/20 bg-card overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardContent className="pt-8 pb-10 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="text-primary" size={28} />
            </div>
            
            <h3 className="text-2xl font-bold mb-2">
              {free ? 'Free Event' : event.price}
            </h3>
            <p className="text-sm text-muted-foreground mb-8 px-6">
              {free 
                ? 'This event is open to the public at no cost.' 
                : 'Tickets are required for this event. Click below to purchase.'}
            </p>

            <div className="space-y-3 px-6">
              {event.ticketUrl && (
                <Button className="w-full font-bold h-12 shadow-lg" size="lg" asChild>
                  <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                    Get Tickets
                  </a>
                </Button>
              )}
              <Button variant="outline" className="w-full font-bold h-12" size="lg" onClick={handleShare}>
                <Share2 size={18} className="mr-2" /> Share Event
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Similar Events */}
        {relatedEvents.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Calendar className="text-primary" size={20} />
              Related Events
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {relatedEvents.map(re => (
                <Link 
                  key={re.id} 
                  href={`/events/${re.slug}`}
                  className="flex gap-4 group p-3 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden shrink-0 border border-border">
                    {re.featuredImage ? (
                      <Image 
                        src={re.featuredImage} 
                        alt={re.title} 
                        width={80}
                        height={80}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <Calendar size={28} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <p className="font-bold group-hover:text-primary transition-colors line-clamp-1">
                      {re.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      {re.startDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-primary font-bold mt-1">
                      {isFree(re.price) ? 'FREE' : re.price}
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
