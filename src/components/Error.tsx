import React from 'react';
import { classNames } from '@/lib/utils';

interface ErrorProps {
  message?: string;
  className?: string;
  retry?: () => void;
}

export default function Error({ message = 'Something went wrong', className, retry }: ErrorProps) {
  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center p-4 rounded-lg bg-red-50 border border-red-200 text-red-700',
        className
      )}
    >
      <p className="font-medium text-lg mb-2">Error</p>
      <p className="text-center mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
