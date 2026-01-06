"use client";

import { Calendar, X, List, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_EVENT_CATEGORIES } from '@/types/event';

export type DateFilter = 'all' | 'today' | 'weekend' | 'month';
export type ViewMode = 'list' | 'calendar';

interface EventFiltersProps {
  dateFilter: DateFilter;
  categoryFilter: string;
  viewMode?: ViewMode;
  categories?: string[];
  onDateFilterChange: (filter: DateFilter) => void;
  onCategoryFilterChange: (category: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
}

export function EventFilters({
  dateFilter,
  categoryFilter,
  viewMode = 'list',
  categories = DEFAULT_EVENT_CATEGORIES,
  onDateFilterChange,
  onCategoryFilterChange,
  onViewModeChange,
  showViewToggle = true,
}: EventFiltersProps) {
  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'All Dates' },
    { key: 'today', label: 'Today' },
    { key: 'weekend', label: 'This Weekend' },
    { key: 'month', label: 'This Month' },
  ];

  const hasActiveFilters = dateFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    onDateFilterChange('all');
    onCategoryFilterChange('all');
  };

  return (
    <div className="space-y-4">
      {/* View Toggle and Clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showViewToggle && onViewModeChange && (
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => onViewModeChange('list')}
                className={`
                  px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors
                  ${viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => onViewModeChange('calendar')}
                className={`
                  px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors
                  ${viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </button>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-2">
        {dateFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onDateFilterChange(filter.key)}
            className={`
              px-4 py-2 text-sm font-medium rounded-full transition-colors
              ${dateFilter === filter.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Category Filters - Scrollable on mobile */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <button
            onClick={() => onCategoryFilterChange('all')}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0
              ${categoryFilter === 'all'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }
            `}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryFilterChange(category)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0
                ${categoryFilter === category
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
        {/* Gradient fade for scroll indicator on mobile */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-gray-900 pointer-events-none md:hidden" />
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
          <div className="flex flex-wrap gap-1">
            {dateFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                onClick={() => onDateFilterChange('all')}
              >
                {dateFilters.find((f) => f.key === dateFilter)?.label}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {categoryFilter !== 'all' && (
              <Badge
                variant="secondary"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => onCategoryFilterChange('all')}
              >
                {categoryFilter}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact filter bar for mobile
export function EventFiltersCompact({
  dateFilter,
  categoryFilter,
  onDateFilterChange,
  onCategoryFilterChange,
}: Omit<EventFiltersProps, 'viewMode' | 'onViewModeChange' | 'showViewToggle'>) {
  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'weekend', label: 'Weekend' },
    { key: 'month', label: 'Month' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {dateFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onDateFilterChange(filter.key)}
          className={`
            px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0
            ${dateFilter === filter.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
