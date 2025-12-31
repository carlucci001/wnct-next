"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Article } from '@/types/article';
import { getArticles } from '@/lib/articles';

const BreakingNews: React.FC = () => {
  const [breakingArticles, setBreakingArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<'entering' | 'visible' | 'exiting'>('entering');

  useEffect(() => {
    const loadBreakingNews = async () => {
      try {
        const allArticles = await getArticles();
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const breaking = allArticles.filter(article => {
          if (!article.isBreakingNews || !article.breakingNewsTimestamp) return false;
          const breakingTime = new Date(article.breakingNewsTimestamp);
          return breakingTime > twentyFourHoursAgo;
        });

        setBreakingArticles(breaking);
      } catch (error) {
        console.error('Failed to load breaking news:', error);
      }
    };

    loadBreakingNews();
    const interval = setInterval(loadBreakingNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (breakingArticles.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    if (animState === 'entering') {
      timeoutId = setTimeout(() => {
        setAnimState('visible');
      }, 50);
    } else if (animState === 'visible') {
      timeoutId = setTimeout(() => {
        setAnimState('exiting');
      }, 4000);
    } else if (animState === 'exiting') {
      timeoutId = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % breakingArticles.length);
        setAnimState('entering');
      }, 700);
    }

    return () => clearTimeout(timeoutId);
  }, [animState, breakingArticles.length]);

  const getTransitionStyles = () => {
    switch (animState) {
      case 'entering':
        return 'translate-x-full opacity-0';
      case 'visible':
        return 'translate-x-0 opacity-100';
      case 'exiting':
        return 'translate-y-4 rotate-6 scale-90 opacity-0 blur-sm origin-left';
      default:
        return '';
    }
  };

  if (breakingArticles.length === 0) return null;

  return (
    <div className="w-full bg-white border-b border-gray-200 h-[36px]">
      <div className="container mx-auto px-4 md:px-0 h-full flex items-center overflow-hidden">
        <div className="bg-red-600 text-white h-full flex items-center px-4 z-10 shrink-0 relative shadow-md">
          <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Breaking</span>
          <div className="absolute -right-2 top-0 h-full w-4 bg-red-600 skew-x-[20deg] z-[-1]"></div>
        </div>

        <div className="flex-grow relative h-full flex items-center pl-8 overflow-hidden">
          <div
            className={`transform transition-all duration-700 ease-in-out text-red-600 text-xs font-bold uppercase truncate w-full absolute left-6 ${getTransitionStyles()}`}
          >
            <Link
              href={`/article/${breakingArticles[currentIndex]?.slug || breakingArticles[currentIndex]?.id}`}
              className="hover:underline cursor-pointer"
            >
              {breakingArticles[currentIndex]?.title || ''}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNews;
