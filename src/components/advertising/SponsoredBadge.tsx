"use client";

import { cn } from '@/lib/utils';

interface SponsoredBadgeProps {
  variant?: 'default' | 'outline' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function SponsoredBadge({
  variant = 'default',
  size = 'sm',
  label = 'Sponsored',
  className = '',
}: SponsoredBadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded';

  const variantClasses = {
    default: 'bg-gray-800/75 dark:bg-gray-900/80 text-white',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80',
    subtle: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}

// Alternative labels for different contexts
export function AdLabel(props: Omit<SponsoredBadgeProps, 'label'>) {
  return <SponsoredBadge {...props} label="Ad" />;
}

export function AdvertisementLabel(props: Omit<SponsoredBadgeProps, 'label'>) {
  return <SponsoredBadge {...props} label="Advertisement" />;
}

export function PromotedLabel(props: Omit<SponsoredBadgeProps, 'label'>) {
  return <SponsoredBadge {...props} label="Promoted" />;
}

export default SponsoredBadge;
