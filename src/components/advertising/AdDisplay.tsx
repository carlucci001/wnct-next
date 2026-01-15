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

    // Header banner - responsive within container, maintains aspect ratio
    if (position === 'header_main') {
      return (
        <a
          href="/contact"
          className={`group relative block w-full max-w-[728px] overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all ${className}`}
          style={{ aspectRatio: '728/90' }}
        >
          {/* Subtle animated gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <div className="text-center">
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Your Ad Could Be Here
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Click to learn more</p>
            </div>
          </div>
        </a>
      );
    }

    // Default fallback for other positions - fully responsive
    // Exact aspect ratios: footer_wide = 728x90, sidebar_top = 300x250, sidebar_sticky = 300x600
    const dimMap: Record<string, string> = {
      sidebar_top: 'aspect-[300/250]',
      sidebar_sticky: 'aspect-[300/600]',
      article_inline: 'aspect-[728/90]',
      footer_wide: 'aspect-[728/90]',
      popup_overlay: 'aspect-video lg:aspect-[4/3] max-w-2xl',
    };
    const dims = dimMap[position] || 'aspect-video';

    // Different mockup for banner ads (728x90)
    if (position === 'footer_wide' || position === 'article_inline') {
      return (
        <a
          href="/contact"
          className={`group relative block w-full overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl ${dims} ${className}`}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center gap-4 px-4">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>

              {/* Text */}
              <div className="text-left">
                <p className="text-sm md:text-base font-bold text-white">
                  This Could Be Your Ad!
                </p>
                <p className="text-[10px] md:text-xs text-white/90">
                  Reach thousands of local readers • Click to learn more
                </p>
              </div>
            </div>
          </div>
        </a>
      );
    }

    // Sidebar ads (300x250 or 300x600)
    // Different layout for tall 300x600 vs square 300x250
    if (position === 'sidebar_sticky') {
      // 300x600 - Tall ad with more content to fill vertical space
      return (
        <a
          href="/contact"
          className={`group relative block w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl ${dims} ${className}`}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform duration-1000" />

          {/* Content - More vertical elements for 300x600 */}
          <div className="absolute inset-0 flex flex-col items-center justify-between p-8 text-center">
            {/* Top section */}
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Large Icon */}
              <div className="bg-white/20 rounded-full p-6 backdrop-blur-sm mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>

              {/* Headline */}
              <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                This Could Be<br />Your Ad!
              </h3>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Reach Local Readers</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Targeted Audience</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Affordable Rates</span>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="w-full">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-white/30 group-hover:bg-white/30 transition-all">
                <p className="text-sm font-bold text-white">Click to Learn More →</p>
              </div>
            </div>
          </div>
        </a>
      );
    }

    // 300x250 - Compact square ad
    return (
      <a
        href="/contact"
        className={`group relative block w-full overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl ${dims} ${className}`}
      >
        {/* Animated shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform duration-1000" />

        {/* Content - Compact for 300x250 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          {/* Icon */}
          <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>

          {/* Text */}
          <p className="text-xl font-bold text-white mb-2">
            This Could Be Your Ad!
          </p>
          <p className="text-sm text-white/90 mb-4">
            Reach your local community
          </p>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-xs font-bold text-white">Learn More →</p>
          </div>
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
