import React from 'react';
import { classNames } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ className, size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={classNames('flex justify-center items-center', className)}>
      <div
        className={classNames(
          'animate-spin rounded-full border-t-2 border-b-2 border-wnc-blue-600',
          sizeClasses[size]
        )}
      ></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
