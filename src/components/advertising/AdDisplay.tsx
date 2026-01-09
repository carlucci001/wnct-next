'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdCampaign, AdPosition } from '@/types/advertising';
import { getActiveAdsByPosition, recordImpression, recordClick } from '@/lib/advertising';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

interface AdDisplayProps {
  position: AdPosition;
  fallback?: React.ReactNode;
  className?: string;
  priority?: boolean;
}

export function AdDisplay({ position, fallback, className, priority }: AdDisplayProps) {
  const [ad, setAd] = useState<AdCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasImpressed, setHasImpressed] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAd() {
      try {
        const ads = await getActiveAdsByPosition(position);
        if (ads && ads.length > 0) {
          // If multiple ads for same position, pick random
          const randomIndex = Math.floor(Math.random() * ads.length);
          setAd(ads[randomIndex]);
        } else {
          setAd(null);
        }
      } catch (error) {
        console.error('Error loading ad for position:', position, error);
        setAd(null);
      } finally {
        setLoading(false);
      }
    }
    loadAd();
  }, [position]);

  // Handle Impression tracking when ad becomes visible
  useEffect(() => {
    if (!ad || hasImpressed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          recordImpression(ad.id);
          setHasImpressed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 } // Ad must be 50% visible
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [ad, hasImpressed]);

  const handleClick = () => {
    if (ad) {
      recordClick(ad.id);
    }
  };

  if (loading) {
    // Header banner loading - no text, exact dimensions
    if (position === 'header_main') {
      return <Skeleton className={`w-[728px] h-[90px] rounded-lg ${className}`} />;
    }
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <Skeleton className="w-full h-full min-h-[100px] rounded-lg" />
        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-black self-center">Advertisement</span>
      </div>
    );
  }

  if (!ad) {
    if (fallback) return <>{fallback}</>;

    // Header banner - pixel perfect 728x90
    if (position === 'header_main') {
      return (
        <a
          href="/contact"
          className={`group relative block w-[728px] h-[90px] overflow-hidden rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 ${className}`}
        >
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          {/* Centered text overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
              Advertise Here
            </span>
          </div>
        </a>
      );
    }

    // Default fallback for other positions
    const dimMap: Record<string, string> = {
      sidebar_top: 'aspect-square md:aspect-[300/250]',
      sidebar_sticky: 'aspect-square md:aspect-[300/600]',
      article_inline: 'aspect-[21/9] md:aspect-[970/250]',
      footer_wide: 'aspect-[21/9] md:aspect-[970/90]',
      popup_overlay: 'aspect-video lg:aspect-[4/3] max-w-2xl',
    };
    const dims = dimMap[position] || 'aspect-video';

    return (
      <a
        href="/contact"
        className={`group relative block overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 ${dims} ${className}`}
      >
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
        {/* Centered text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
            Advertise Here
          </span>
        </div>
      </a>
    );
  }

  // Header banner - pixel perfect, no labels
  if (position === 'header_main') {
    return (
      <div ref={adRef} className={`w-[728px] h-[90px] overflow-hidden rounded-lg ${className}`}>
        {ad.type === 'image' && (
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block w-full h-full"
          >
            <Image
              src={ad.imageUrl || ''}
              alt={ad.title}
              width={728}
              height={90}
              priority={priority}
              className="w-[728px] h-[90px] object-cover"
            />
          </a>
        )}
        {ad.type === 'html' && (
          <div
            dangerouslySetInnerHTML={{ __html: ad.htmlContent || '' }}
            className="w-full h-full"
          />
        )}
      </div>
    );
  }

  // Other positions - with label
  return (
    <div ref={adRef} className={`relative flex flex-col items-center gap-1.5 ${className}`}>
      <span className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.2em] font-black">Advertisement</span>

      <div className="relative group w-full overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all border border-border/50 bg-muted/20">
        {ad.type === 'image' && (
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="block w-full h-full relative"
          >
            <Image
              src={ad.imageUrl || ''}
              alt={ad.title}
              width={800}
              height={400}
              priority={priority}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ width: '100%', height: 'auto' }}
            />

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        )}

        {ad.type === 'html' && (
          <div
            dangerouslySetInnerHTML={{ __html: ad.htmlContent || '' }}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
}
