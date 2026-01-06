'use client';

import { Business } from '@/types/business';
import { BusinessCard, BusinessCardSkeleton } from './BusinessCard';

interface DirectoryGridProps {
  businesses: Business[];
  loading?: boolean;
}

export function DirectoryGrid({ businesses, loading }: DirectoryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
        <div className="text-4xl mb-4">🏢</div>
        <h3 className="font-semibold text-lg mb-2">No businesses found</h3>
        <p className="text-muted-foreground text-sm">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {businesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
}
