'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
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
import { Separator } from '@/components/ui/separator';
import { Business } from '@/types/business';
import { getBusinessBySlug, getActiveBusinesses, getTodayHours, getGoogleMapsUrl, isBusinessOpen } from '@/lib/directory';
import { BusinessCard } from '@/components/directory/BusinessCard';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [relatedBusinesses, setRelatedBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      setLoading(true);
      try {
        const data = await getBusinessBySlug(slug);
        if (data) {
          setBusiness(data);
          // Load related businesses in same category
          const related = await getActiveBusinesses(data.category);
          setRelatedBusinesses(related.filter(b => b.id !== data.id).slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading business:', error);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadBusiness();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Business Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The business you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/directory">Back to Directory</Link>
          </Button>
        </div>
      </div>
    );
  }

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
      } catch (error) {
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
    <div className="container mx-auto px-4 md:px-0 py-6 min-h-screen">
      {/* Back Button */}
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft size={16} className="mr-2" />
        Back to Directory
      </Button>

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
                <Badge className="bg-yellow-500 text-yellow-950">
                  <Star size={12} className="mr-1" fill="currentColor" />
                  Featured
                </Badge>
              )}
              <Badge variant={isOpen ? 'default' : 'secondary'}>
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
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 size={18} />
              </Button>
            </div>

            <p className="text-lg text-muted-foreground mb-6">{business.description}</p>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <MapPin className="shrink-0 mt-0.5 text-primary" size={20} />
                <div>
                  <p className="font-medium">{business.address.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {business.address.city}, {business.address.state} {business.address.zip}
                  </p>
                  <p className="text-sm text-primary mt-1 flex items-center gap-1">
                    Get Directions <ExternalLink size={12} />
                  </p>
                </div>
              </a>

              {/* Hours */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Clock className="shrink-0 mt-0.5 text-primary" size={20} />
                <div>
                  <p className="font-medium">Today&apos;s Hours</p>
                  <p className="text-sm text-muted-foreground">{todayHours}</p>
                </div>
              </div>

              {/* Phone */}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <Phone className="shrink-0 text-primary" size={20} />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{business.phone}</p>
                  </div>
                </a>
              )}

              {/* Email */}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <Mail className="shrink-0 text-primary" size={20} />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{business.email}</p>
                  </div>
                </a>
              )}

              {/* Website */}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <Globe className="shrink-0 text-primary" size={20} />
                  <div>
                    <p className="font-medium">Website</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Visit Website <ExternalLink size={12} />
                    </p>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Photo Gallery */}
          {business.images && business.images.length > 1 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {business.images.slice(1).map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={img}
                      alt={`${business.name} photo ${i + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3 space-y-6">
          {/* Full Hours */}
          {business.hours && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock size={16} />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {dayNames.map((day, i) => {
                    const hours = business.hours?.[day.toLowerCase() as keyof typeof business.hours];
                    const isToday = i === today;
                    return (
                      <li
                        key={day}
                        className={`flex justify-between text-sm ${
                          isToday ? 'font-semibold text-primary' : ''
                        }`}
                      >
                        <span>{day}</span>
                        <span>{hours || 'Closed'}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Claim Business CTA */}
          {!business.ownerId && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold mb-2">Is this your business?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Claim this listing to update information and respond to customers.
                </p>
                <Button size="sm" className="w-full">
                  Claim This Business
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Related Businesses */}
          {relatedBusinesses.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Related Businesses</h2>
              <div className="space-y-4">
                {relatedBusinesses.map((b) => (
                  <Link
                    key={b.id}
                    href={`/directory/${b.slug}`}
                    className="flex gap-3 group"
                  >
                    <div className="w-16 h-16 bg-muted rounded overflow-hidden shrink-0">
                      {b.logo ? (
                        <img src={b.logo} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                          {b.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {b.name}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
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
    </div>
  );
}
