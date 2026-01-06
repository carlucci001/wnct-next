"use client";

import { useState, useEffect } from 'react';
import { Advertisement } from '@/types/advertisement';
import { getAdsByType } from '@/lib/advertising';
import { AdBanner } from './AdBanner';
import { Skeleton } from '@/components/ui/skeleton';

interface AdSidebarProps {
  maxAds?: number;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export function AdSidebar({
  maxAds = 2,
  className = '',
  spacing = 'md',
}: AdSidebarProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  const spacingClasses = {
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  useEffect(() => {
    async function fetchSidebarAds() {
      try {
        setLoading(true);
        const sidebarAds = await getAdsByType('sidebar');
        setAds(sidebarAds.slice(0, maxAds));
      } catch (err) {
        console.error('Error fetching sidebar ads:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSidebarAds();
  }, [maxAds]);

  if (loading) {
    return (
      <div className={`${spacingClasses[spacing]} ${className}`}>
        {Array.from({ length: maxAds }).map((_, i) => (
          <Skeleton key={i} className="w-full h-[250px] rounded-lg" />
        ))}
      </div>
    );
  }

  // Show fallback placeholders if no ads
  if (ads.length === 0) {
    return (
      <div className={`${spacingClasses[spacing]} ${className}`}>
        {Array.from({ length: maxAds }).map((_, i) => (
          <AdBanner
            key={i}
            placement={`sidebar-${i}`}
            size="MEDIUM_RECTANGLE"
            showFallback={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {ads.map((ad) => (
        <AdBanner
          key={ad.id}
          placement={ad.placement}
          size={ad.size || 'MEDIUM_RECTANGLE'}
          showFallback={true}
        />
      ))}
    </div>
  );
}

export default AdSidebar;
