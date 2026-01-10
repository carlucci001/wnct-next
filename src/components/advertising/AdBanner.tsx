"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Advertisement, AD_SIZES } from '@/types/advertisement';
import { getAdsByPlacement, trackImpression, trackClick } from '@/lib/advertising';
import { Skeleton } from '@/components/ui/skeleton';
import { SponsoredBadge } from './SponsoredBadge';

interface AdBannerProps {
  placement: string;
  size?: keyof typeof AD_SIZES | string;
  className?: string;
  showFallback?: boolean;
}

export function AdBanner({
  placement,
  size = 'MEDIUM_RECTANGLE',
  className = '',
  showFallback = true,
}: AdBannerProps) {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [impressionTracked, setImpressionTracked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse size dimensions
  const sizeValue = AD_SIZES[size as keyof typeof AD_SIZES] || size;
  const [width, height] = sizeValue.split('x').map(Number);

  // Fetch ad for this placement
  useEffect(() => {
    async function fetchAd() {
      try {
        setLoading(true);
        const ads = await getAdsByPlacement(placement);
        if (ads.length > 0) {
          // Select random ad weighted by priority
          const totalPriority = ads.reduce((sum, ad) => sum + ad.priority, 0);
          let random = Math.random() * totalPriority;
          let selectedAd = ads[0];

          for (const adItem of ads) {
            random -= adItem.priority;
            if (random <= 0) {
              selectedAd = adItem;
              break;
            }
          }

          setAd(selectedAd);
        }
      } catch (err) {
        console.error('Error fetching ad:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchAd();
  }, [placement]);

  // Track impression when ad is visible (lazy loading)
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && ad && !impressionTracked) {
          trackImpression(ad.id).catch(console.error);
          setImpressionTracked(true);
        }
      });
    },
    [ad, impressionTracked]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5, // Track when 50% visible
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersection]);

  // Handle ad click
  const handleClick = () => {
    if (ad) {
      trackClick(ad.id).catch(console.error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className={`relative ${className}`}
        style={{ width: width || 300, height: height || 250 }}
      >
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  // Error or no ad available - show fallback
  if (error || !ad) {
    if (!showFallback) return null;

    return (
      <div
        ref={containerRef}
        className={`relative flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg ${className}`}
        style={{ width: width || 300, height: height || 250 }}
      >
        <div className="text-center p-4">
          <ExternalLink className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Advertise Here
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {sizeValue}
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Learn More
          </Link>
        </div>
      </div>
    );
  }

  // Render ad
  return (
    <div
      ref={containerRef}
      className={`relative group ${className}`}
      style={{ width: width || 300, height: height || 250 }}
    >
      <Link
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block w-full h-full"
      >
        <div className="relative w-full h-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 transition-shadow hover:shadow-md">
          {ad.imageUrl ? (
            <Image
              src={ad.imageUrl}
              alt={ad.altText || ad.name}
              fill
              className="object-cover"
              loading="lazy"
              sizes={`${width}px`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{ad.name}</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

          {/* External link indicator on hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-1">
              <ExternalLink className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
        </div>
      </Link>

      {/* Sponsored badge */}
      <div className="absolute bottom-1 left-1">
        <SponsoredBadge size="sm" />
      </div>
    </div>
  );
}

export default AdBanner;
