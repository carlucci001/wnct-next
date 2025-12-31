"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Article } from '@/types/article';

interface CategoryFeaturedSliderProps {
  articles: Article[];
  accentColor?: string;
}

const CategoryFeaturedSlider: React.FC<CategoryFeaturedSliderProps> = ({ articles, accentColor = '#1d4ed8' }) => {
  const featured = articles.slice(0, 3);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (featured.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  return (
    <div className="w-full h-[300px] mb-8 relative group bg-gray-100 border-b border-gray-200">

      {/* Desktop View: Show all 3 side-by-side */}
      <div className="hidden md:grid grid-cols-3 grid-rows-[1fr] h-full divide-x divide-white/20">
        {featured.map((article) => {
          const imageUrl = article.featuredImage || article.imageUrl || '/placeholder.jpg';
          return (
            <div key={article.id} className="relative h-full overflow-hidden group/card">
              <Image
                src={imageUrl}
                alt={article.title}
                fill
                className="object-cover transition duration-700 group-hover/card:scale-105"
                sizes="33vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider mb-2 inline-block px-2 py-0.5 rounded-sm text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  Featured
                </span>
                <Link href={`/article/${article.slug || article.id}`}>
                  <h3 className="text-lg font-serif font-bold text-white leading-tight hover:text-gray-200 transition line-clamp-3">
                    {article.title}
                  </h3>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile View: Single Item Slider */}
      <div className="md:hidden relative h-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {featured.map((article) => {
            const imageUrl = article.featuredImage || article.imageUrl || '/placeholder.jpg';
            return (
              <div key={article.id} className="min-w-full h-full relative">
                <Image
                  src={imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider mb-2 inline-block px-2 py-0.5 rounded-sm text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Featured
                  </span>
                  <Link href={`/article/${article.slug || article.id}`}>
                    <h3 className="text-xl font-serif font-bold text-white leading-tight hover:text-gray-200 transition">
                      {article.title}
                    </h3>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Arrows */}
        {featured.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryFeaturedSlider;
