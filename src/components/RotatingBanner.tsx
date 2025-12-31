"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Banner {
  src: string;
  alt: string;
  link?: string;
}

// For sprite-based banners (single image with multiple banners stacked)
interface BannerSprite {
  alt: string;
  link?: string;
  offsetY: number; // Y offset in the sprite image
}

interface RotatingBannerProps {
  // Option 1: Individual banner images
  banners?: Banner[];
  // Option 2: Single sprite image with stacked banners
  spriteImage?: string;
  spriteOffsets?: BannerSprite[];
  width?: number;
  height?: number;
  interval?: number; // in milliseconds
  className?: string;
}

const RotatingBanner: React.FC<RotatingBannerProps> = ({
  banners = [],
  spriteImage,
  spriteOffsets = [],
  width = 728,
  height = 90,
  interval = 10000, // 10 seconds default
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Determine which mode we're in
  const useSprite = spriteImage && spriteOffsets.length > 0;
  const totalItems = useSprite ? spriteOffsets.length : banners.length;

  useEffect(() => {
    if (totalItems <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % totalItems);
        setIsTransitioning(false);
      }, 300); // Fade duration
    }, interval);

    return () => clearInterval(timer);
  }, [totalItems, interval]);

  // Empty state
  if (totalItems === 0) {
    return (
      <div
        className={`bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded flex items-center justify-center text-gray-400 text-sm ${className}`}
        style={{ width, height }}
      >
        Advertisement ({width}x{height})
      </div>
    );
  }

  const currentItem = useSprite ? spriteOffsets[currentIndex] : banners[currentIndex];
  const currentLink = currentItem?.link;

  const bannerContent = (
    <div
      className={`relative overflow-hidden rounded ${className}`}
      style={{ width, height }}
    >
      <div
        className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        {useSprite ? (
          // Sprite mode - show section of stacked image
          <div
            style={{
              width,
              height,
              backgroundImage: `url(${spriteImage})`,
              backgroundPosition: `center -${spriteOffsets[currentIndex].offsetY}px`,
              backgroundSize: 'auto',
              backgroundRepeat: 'no-repeat',
            }}
            role="img"
            aria-label={spriteOffsets[currentIndex].alt}
          />
        ) : (
          // Individual images mode
          <Image
            src={(currentItem as Banner).src}
            alt={(currentItem as Banner).alt}
            width={width}
            height={height}
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Progress dots */}
      {totalItems > 1 && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
          {Array.from({ length: totalItems }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(idx);
                  setIsTransitioning(false);
                }, 300);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-white shadow-md'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to banner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (currentLink) {
    return (
      <a
        href={currentLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {bannerContent}
      </a>
    );
  }

  return bannerContent;
};

export default RotatingBanner;
