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
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <Skeleton className="w-full h-full min-h-[100px] rounded-lg" />
        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-black self-center">Advertisement</span>
      </div>
    );
  }

  if (!ad) {
    if (fallback) return <>{fallback}</>;
    
    // Default Premium Fallback
    const dimMap: Record<string, string> = {
      header_main: 'max-h-[90px] aspect-[728/90]',
      sidebar_top: 'aspect-square md:aspect-[300/250]',
      sidebar_sticky: 'aspect-square md:aspect-[300/600]',
      article_inline: 'aspect-[21/9] md:aspect-[970/250]',
      footer_wide: 'aspect-[21/9] md:aspect-[970/90]',
      popup_overlay: 'aspect-video lg:aspect-[4/3] max-w-2xl',
    };
    const dims = dimMap[position] || 'aspect-video';

    return (
      <div className={`group relative overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 flex flex-col items-center justify-center p-8 transition-all hover:bg-muted/10 hover:border-primary/20 ${dims} ${className}`}>
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-foreground/60">Advertise Here</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Reach 50k+ local WNC readers monthly</p>
          </div>
          <a
            href="/contact"
            className="mt-2 px-6 py-2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
          >
            Contact Us
          </a>
        </div>
      </div>
    );
  }

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
              width={800} // High enough default
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
